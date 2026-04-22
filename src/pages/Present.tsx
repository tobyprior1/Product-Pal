import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useDataStore } from "@/lib/pm-supabase-store"
import type { OSTNode } from "@/lib/pm-types"
import { OutcomeNode } from "@/components/nodes/OutcomeNode"
import { OpportunityNode } from "@/components/nodes/OpportunityNode"
import { SolutionNode } from "@/components/nodes/SolutionNode"
import { ExperimentNode } from "@/components/nodes/ExperimentNode"
import dagre from "dagre"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

  return { nodes: layoutedNodes, edges }
}

function PresentModeInner() {
  const navigate = useNavigate()
  const ostNodes = useDataStore((state) => state.nodes)
  const { fitView } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [focusedNodeIndex, setFocusedNodeIndex] = useState(0)
  const [pathToRoot, setPathToRoot] = useState<Set<string>>(new Set())

  // Convert OST nodes to React Flow nodes
  useEffect(() => {
    const flowNodes: Node[] = ostNodes.map((node: OSTNode) => ({
      id: node.id,
      type: node.type,
      data: node as any,
      position: { x: 0, y: 0 },
    }))

    const flowEdges: Edge[] = ostNodes
      .filter((node) => node.parentId)
      .map((node) => ({
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
        },
      }))

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges)

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [ostNodes])

  // Calculate path to root for focused node
  useEffect(() => {
    if (nodes.length === 0) return

    const focusedNode = nodes[focusedNodeIndex]
    if (!focusedNode) return

    const path = new Set<string>([focusedNode.id])
    let currentNode = ostNodes.find((n) => n.id === focusedNode.id)

    while (currentNode?.parentId) {
      path.add(currentNode.parentId)
      currentNode = ostNodes.find((n) => n.id === currentNode?.parentId)
    }

    setPathToRoot(path)

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: {
          ...node.style,
          opacity: path.has(node.id) ? 1 : 0.3,
        },
      })),
    )

    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          opacity: path.has(edge.source) && path.has(edge.target) ? 1 : 0.2,
        },
      })),
    )

    // Fit view to focused node and its path after updating opacity
    setTimeout(() => {
      const nodeIds = Array.from(path).map(id => ({ id }))
      fitView({
        nodes: nodeIds,
        padding: 0.2,
        duration: 500,
        maxZoom: 1.2,
      })
    }, 100)
  }, [focusedNodeIndex, ostNodes, fitView])

  const handleNext = useCallback(() => {
    setFocusedNodeIndex((prev) => (prev + 1) % nodes.length)
  }, [nodes])

  const handlePrevious = useCallback(() => {
    setFocusedNodeIndex((prev) => (prev - 1 + nodes.length) % nodes.length)
  }, [nodes])

  const handleExit = useCallback(() => {
    navigate("/editor")
  }, [navigate])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === "Escape") {
        e.preventDefault()
        handleExit()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleNext, handlePrevious, handleExit])

  const focusedNode = nodes[focusedNodeIndex]
  const focusedOSTNode = ostNodes.find((n) => n.id === focusedNode?.id)

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="h-16 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Badge variant="outline">Present Mode</Badge>
          {focusedOSTNode && (
            <div className="flex items-center gap-2">
              <Badge>{focusedOSTNode.type}</Badge>
              <span className="text-sm font-medium">{focusedOSTNode.title}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {focusedNodeIndex + 1} / {nodes.length}
          </span>
          <Button variant="ghost" size="sm" onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="icon" onClick={handleExit}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Flow canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
        >
          <Background className="bg-gray-50" color="#d1d5db" />
        </ReactFlow>
      </div>

      {/* Bottom info panel */}
      {focusedOSTNode && (
        <div className="border-t border-border bg-card p-6 max-h-48 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-3">
            {focusedOSTNode.notes && (
              <div>
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{focusedOSTNode.notes}</p>
              </div>
            )}

            {focusedOSTNode.type === "Outcome" && (
              <div className="flex gap-6 text-sm">
                {(focusedOSTNode as any).metric && (
                  <div>
                    <span className="text-muted-foreground">Metric:</span> <span>{(focusedOSTNode as any).metric}</span>
                  </div>
                )}
                {(focusedOSTNode as any).baseline !== undefined && (focusedOSTNode as any).target !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Target:</span>{" "}
                    <span className="font-mono">
                      {(focusedOSTNode as any).baseline}% → {(focusedOSTNode as any).target}%
                    </span>
                  </div>
                )}
                {(focusedOSTNode as any).timeframe && (
                  <div>
                    <span className="text-muted-foreground">Timeframe:</span> <span>{(focusedOSTNode as any).timeframe}</span>
                  </div>
                )}
              </div>
            )}

            {focusedOSTNode.type === "Experiment" && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Hypothesis:</span> <span>{(focusedOSTNode as any).hypothesis}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Method:</span> <span>{(focusedOSTNode as any).method}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Present() {
  return (
    <ReactFlowProvider>
      <PresentModeInner />
    </ReactFlowProvider>
  )
}
