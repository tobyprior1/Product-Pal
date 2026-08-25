import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, ChevronDown, ChevronUp } from "lucide-react"
import { useUIStore } from "@/lib/pm-ui-store"
import type { SolutionNode as SolutionNodeType } from "@/lib/pm-types"
import { AddChildButton } from "@/components/AddChildButton"

export const SolutionNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as SolutionNodeType
  const collapsedSolutions = useUIStore((state) => state.collapsedSolutions)
  const toggleSolutionCollapse = useUIStore((state) => state.toggleSolutionCollapse)
  const isLocked = useUIStore((state) => state.isLocked)
  
  const isCollapsed = collapsedSolutions.has(nodeData.id)

  const handleAddChild = () => {
    window.dispatchEvent(
      new CustomEvent("add-child-node", {
        detail: { parentId: nodeData.id, parentType: nodeData.type },
      })
    )
  }

  const getStatusColor = () => {
    switch (nodeData.status) {
      case "Now":
        return "bg-blue-100 border-blue-300 text-blue-900"
      case "Next":
        return "bg-purple-100 border-purple-300 text-purple-900"
      case "Later":
        return "bg-gray-100 border-gray-300 text-gray-900"
      case "Planned":
        return "bg-violet-100 border-violet-300 text-violet-900"
      case "Done":
        return "bg-green-100 border-green-300 text-green-900"
      case "Backlog":
        return "bg-orange-100 border-orange-300 text-orange-900"
      default:
        return "bg-white border-gray-200"
    }
  }

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      
      <Card className={`w-80 p-4 border-2 shadow-md ${getStatusColor()}`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Zap className="w-4 h-4 flex-shrink-0" />
            <h3 className="font-medium text-sm">{nodeData.title}</h3>
          </div>
          <button 
            onClick={() => toggleSolutionCollapse(nodeData.id)}
            className="ml-2 p-1 hover:bg-black/5 rounded"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {nodeData.status && (
            <Badge variant="secondary" className="text-xs">
              {nodeData.status}
            </Badge>
          )}
          {nodeData.releaseStatus && (
            <Badge 
              variant={nodeData.releaseStatus === "released" ? "default" : "outline"} 
              className="text-xs"
            >
              {nodeData.releaseStatus === "released" ? "Released" : "Not Released"}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">Solution</span>
        </div>
      </div>
    </Card>

    <Handle type="source" position={Position.Bottom} className="!bg-primary" />

    <AddChildButton
      onAddChild={handleAddChild}
      disabled={isLocked}
    />
  </div>
  )
})

SolutionNode.displayName = "SolutionNode"
