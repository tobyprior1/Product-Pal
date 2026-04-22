import { useCallback, useEffect, useRef } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"
import type { OSTNode } from "@/lib/pm-types"
import { OutcomeNode } from "./nodes/OutcomeNode"
import { OpportunityNode } from "./nodes/OpportunityNode"
import { SolutionNode } from "./nodes/SolutionNode"
import { ExperimentNode } from "./nodes/ExperimentNode"
import dagre from "dagre"
import { toPng } from "html-to-image"
import { jsPDF } from "jspdf"
import { useToast } from "@/hooks/use-toast"

const nodeTypes = {
  Outcome: OutcomeNode,
  Opportunity: OpportunityNode,
  Solution: SolutionNode,
  Experiment: ExperimentNode,
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 120 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 320, height: 150 })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 160,
        y: nodeWithPosition.y - 75,
      },
    }
  })

  // Build parent-to-children map
  const childrenMap = new Map<string, string[]>()
  edges.forEach((edge) => {
    const children = childrenMap.get(edge.source) || []
    children.push(edge.target)
    childrenMap.set(edge.source, children)
  })

  // Create a position map for easy lookup and updates
  const positionMap = new Map<string, { x: number; y: number }>()
  layoutedNodes.forEach((node) => {
    positionMap.set(node.id, { ...node.position })
  })

  // Center-align single children with their parents
  layoutedNodes.forEach((node) => {
    const children = childrenMap.get(node.id) || []
    if (children.length === 1) {
      // This parent has exactly one child - center it
      const childId = children[0]
      const parentPos = positionMap.get(node.id)
      const childPos = positionMap.get(childId)

      if (parentPos && childPos) {
        // Update child's x position to match parent's x position
        childPos.x = parentPos.x
        positionMap.set(childId, childPos)
      }
    }
  })

  // Apply the updated positions back to nodes
  const finalNodes = layoutedNodes.map((node) => {
    const updatedPos = positionMap.get(node.id)
    return {
      ...node,
      position: updatedPos || node.position,
    }
  })

  return { nodes: finalNodes, edges }
}

function FlowEditorInner() {
  const ostNodes = useDataStore((state) => state.nodes)
  const setSelectedNodeId = useUIStore((state) => state.setSelectedNodeId)
  const focusedNodeId = useUIStore((state) => state.focusedNodeId)
  const setFocusedNodeId = useUIStore((state) => state.setFocusedNodeId)
  const isLocked = useUIStore((state) => state.isLocked)
  const showCompletedExperiments = useUIStore((state) => state.showCompletedExperiments)
  const collapsedOpportunities = useUIStore((state) => state.collapsedOpportunities)
  const collapsedSolutions = useUIStore((state) => state.collapsedSolutions)

  const { toast } = useToast()
  const { fitView } = useReactFlow()
  const flowRef = useRef<HTMLDivElement>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const getDescendantIds = useCallback((nodeId: string, allNodes: OSTNode[]): Set<string> => {
    const descendants = new Set<string>([nodeId])

    const findChildren = (parentId: string) => {
      allNodes.forEach((node) => {
        if (node.parentId === parentId) {
          descendants.add(node.id)
          findChildren(node.id)
        }
      })
    }

    findChildren(nodeId)
    return descendants
  }, [])

  useEffect(() => {
    if (focusedNodeId) {
      // Focus mode activated - center on focused node and descendants
      const visibleNodeIds = getDescendantIds(focusedNodeId, ostNodes)
      const nodeIdsArray = Array.from(visibleNodeIds)

      // Wait for nodes to be rendered with new opacity before fitting view
      setTimeout(() => {
        fitView({
          nodes: nodeIdsArray.map((id) => ({ id })),
          padding: 0.2,
          duration: 500,
          maxZoom: 1.5,
        })
      }, 50)
    } else {
      // Focus mode deactivated - show all nodes
      setTimeout(() => {
        fitView({
          padding: 0.1,
          duration: 500,
          maxZoom: 1.5,
        })
      }, 50)
    }
  }, [focusedNodeId, ostNodes, getDescendantIds, fitView])

  useEffect(() => {
    // Skip viewport adjustment if in focus mode (focus mode handles its own viewport)
    if (focusedNodeId) return

    // Wait for layout to update after collapse/expand, then smoothly adjust viewport
    const timeoutId = setTimeout(() => {
      fitView({
        padding: 0.15,
        duration: 600,
        maxZoom: 1.5,
        minZoom: 0.5,
      })
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [collapsedOpportunities, collapsedSolutions, focusedNodeId, fitView])

  useEffect(() => {
    let visibleNodeIds: Set<string> | null = null
    if (focusedNodeId) {
      visibleNodeIds = getDescendantIds(focusedNodeId, ostNodes)
    }

    const filteredNodes = ostNodes.filter((node) => {
      if (node.type === "Solution" && node.parentId && collapsedOpportunities.has(node.parentId)) {
        return false
      }

      if (node.type === "Experiment" && node.parentId && collapsedSolutions.has(node.parentId)) {
        return false
      }

      if (node.type === "Experiment" && node.parentId) {
        const parentSolution = ostNodes.find((n) => n.id === node.parentId)
        if (parentSolution && parentSolution.type === "Solution" && parentSolution.parentId) {
          if (collapsedOpportunities.has(parentSolution.parentId)) {
            return false
          }
        }
      }

      if (node.type === "Experiment") {
        const isCompleted = (node as any).status === "completed" || (node as any).decision === "ship"

        if (isCompleted) {
          // If parent opportunity is collapsed, hide this completed experiment
          if (node.parentId && collapsedOpportunities.has(node.parentId)) {
            return false
          }
        }
      }

      return true
    })

    const flowNodes: Node[] = filteredNodes.map((node: OSTNode) => {
      const isVisible = !focusedNodeId || visibleNodeIds?.has(node.id)
      const isFocused = node.id === focusedNodeId

      const isCompletedNode =
        (node.type === "Experiment" && ((node as any).status === "completed" || (node as any).decision === "ship")) ||
        (node.type === "Solution" && (node as any).status === "Done") ||
        (node.type === "Opportunity" && (node as any).status === "invalidated")

      const shouldFade = isCompletedNode && !showCompletedExperiments

      let opacity = 1
      if (!isVisible) {
        opacity = 0.15 // Focus mode dimming
      } else if (shouldFade) {
        opacity = 0.3 // Fade completed nodes when toggle is off
      }

      return {
        id: node.id,
        type: node.type,
        data: { ...node, isFocused },
        position: { x: 0, y: 0 },
        style: {
          opacity,
          transition: "opacity 0.3s ease",
        },
        draggable: isVisible && !isLocked,
        selectable: isVisible && !isLocked,
      }
    })

    const flowEdges: Edge[] = filteredNodes
      .filter((node) => node.parentId)
      .map((node) => {
        const isVisible = !focusedNodeId || (visibleNodeIds?.has(node.id) && visibleNodeIds?.has(node.parentId!))

        const isCompletedNode =
          (node.type === "Experiment" && ((node as any).status === "completed" || (node as any).decision === "ship")) ||
          (node.type === "Solution" && (node as any).status === "Done") ||
          (node.type === "Opportunity" && (node as any).status === "invalidated")

        const shouldFade = isCompletedNode && !showCompletedExperiments

        let opacity = 1
        if (!isVisible) {
          opacity = 0.15 // Focus mode dimming
        } else if (shouldFade) {
          opacity = 0.3 // Fade edges to completed nodes
        }

        return {
          id: `${node.parentId}-${node.id}`,
          source: node.parentId!,
          target: node.id,
          type: "smoothstep",
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: "#000000",
          },
          style: {
            strokeWidth: 2,
            stroke: "#000000",
            opacity,
            transition: "opacity 0.3s ease",
          },
          data: { borderRadius: 96 },
        }
      })

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges)

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [
    ostNodes,
    focusedNodeId,
    getDescendantIds,
    setNodes,
    setEdges,
    isLocked,
    showCompletedExperiments,
    collapsedOpportunities,
    collapsedSolutions,
  ])

  useEffect(() => {
    const handleTidy = () => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
      setTimeout(() => fitView({ duration: 300 }), 100)
    }

    window.addEventListener("tidy-layout", handleTidy)
    return () => window.removeEventListener("tidy-layout", handleTidy)
  }, [nodes, edges, setNodes, setEdges, fitView])

  useEffect(() => {
    const handleExportPNG = async () => {
      if (!flowRef.current) return

      try {
        const viewport = flowRef.current.querySelector(".react-flow__viewport") as HTMLElement
        if (!viewport) return

        toast({
          title: "Exporting PNG...",
          description: "Generating your tree image",
        })

        const dataUrl = await toPng(viewport, {
          backgroundColor: "transparent",
          pixelRatio: 2,
          filter: (node) => {
            if (node.classList?.contains("react-flow__controls")) return false
            if (node.classList?.contains("react-flow__minimap")) return false
            if (node.classList?.contains("react-flow__background")) return false
            return true
          },
        })

        const link = document.createElement("a")
        link.download = `ost-tree-${Date.now()}.png`
        link.href = dataUrl
        link.click()

        toast({
          title: "PNG exported!",
          description: "Your tree has been saved as a PNG image",
        })
      } catch (error) {
        console.error("Export PNG failed:", error)
        toast({
          title: "Export failed",
          description: "Could not export PNG. Please try again.",
          variant: "destructive",
        })
      }
    }

    window.addEventListener("export-png", handleExportPNG)
    return () => window.removeEventListener("export-png", handleExportPNG)
  }, [toast])

  useEffect(() => {
    const handleExportPDF = async () => {
      if (!flowRef.current) return

      try {
        const viewport = flowRef.current.querySelector(".react-flow__viewport") as HTMLElement
        if (!viewport) return

        toast({
          title: "Exporting PDF...",
          description: "Generating your tree document",
        })

        const dataUrl = await toPng(viewport, {
          backgroundColor: "#ffffff",
          pixelRatio: 2,
          filter: (node) => {
            if (node.classList?.contains("react-flow__controls")) return false
            if (node.classList?.contains("react-flow__minimap")) return false
            if (node.classList?.contains("react-flow__background")) return false
            return true
          },
        })

        const img = new Image()
        img.src = dataUrl

        img.onload = () => {
          const a3Width = 420
          const a3Height = 297

          const imgAspect = img.width / img.height
          const isLandscape = imgAspect > a3Width / a3Height

          const pdf = new jsPDF({
            orientation: isLandscape ? "landscape" : "portrait",
            unit: "mm",
            format: "a3",
          })

          const pdfWidth = isLandscape ? a3Width : a3Height
          const pdfHeight = isLandscape ? a3Height : a3Width

          const scale = Math.min(pdfWidth / img.width, pdfHeight / img.height)
          const scaledWidth = img.width * scale
          const scaledHeight = img.height * scale

          const x = (pdfWidth - scaledWidth) / 2
          const y = (pdfHeight - scaledHeight) / 2

          pdf.addImage(dataUrl, "PNG", x, y, scaledWidth, scaledHeight)
          pdf.save(`ost-tree-${Date.now()}.pdf`)

          toast({
            title: "PDF exported!",
            description: "Your tree has been saved as a PDF document",
          })
        }
      } catch (error) {
        console.error("Export PDF failed:", error)
        toast({
          title: "Export failed",
          description: "Could not export PDF. Please try again.",
          variant: "destructive",
        })
      }
    }

    window.addEventListener("export-pdf", handleExportPDF)
    return () => window.removeEventListener("export-pdf", handleExportPDF)
  }, [toast])

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id)
      setFocusedNodeId(node.id)
    },
    [setSelectedNodeId, setFocusedNodeId],
  )

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setFocusedNodeId(null)
  }, [setSelectedNodeId, setFocusedNodeId])

  const handleAddNode = useCallback(() => {
    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true
    })
    document.dispatchEvent(event)
  }, [])

  return (
    <div ref={flowRef} className="w-full h-full bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
        }}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        panOnDrag={!isLocked}
        zoomOnScroll={!isLocked}
        zoomOnPinch={!isLocked}
        zoomOnDoubleClick={!isLocked}
      >
        <Background className="bg-gray-50" color="#d1d5db" />
        <Controls className="bg-card border-border" showInteractive={false} />
      </ReactFlow>

      {/* Floating Add Node Button */}
      <button
        onClick={handleAddNode}
        className="absolute bottom-6 right-6 z-10 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        style={{
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3), 0 0 0 4px rgba(37, 99, 235, 0.1)'
        }}
        title="Add new node (Ctrl+N)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  )
}

export function FlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowEditorInner />
    </ReactFlowProvider>
  )
}
