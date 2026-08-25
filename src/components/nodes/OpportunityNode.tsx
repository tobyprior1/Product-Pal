import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react"
import { useUIStore } from "@/lib/pm-ui-store"
import { useDataStore } from "@/lib/pm-supabase-store"
import { calculatePriorityScore } from "@/lib/pm-utils"
import type { OpportunityNode as OpportunityNodeType } from "@/lib/pm-types"
import { AddChildButton } from "@/components/AddChildButton"

export const OpportunityNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as OpportunityNodeType
  const collapsedOpportunities = useUIStore((state) => state.collapsedOpportunities)
  const toggleOpportunityCollapse = useUIStore((state) => state.toggleOpportunityCollapse)
  const isLocked = useUIStore((state) => state.isLocked)
  const isParentOpportunity = useDataStore((state) => state.isParentOpportunity(nodeData.id))
  const isSubOpportunity = useDataStore((state) => state.isSubOpportunity(nodeData.id))
  const canAddSubOpportunity = useDataStore((state) => state.canAddSubOpportunity(nodeData.id))
  const canAddSolution = useDataStore((state) => state.canAddSolution(nodeData.id))
  
  const isCollapsed = collapsedOpportunities.has(nodeData.id)
  const priorityScore = calculatePriorityScore(nodeData)

  const handleAddChild = () => {
    window.dispatchEvent(
      new CustomEvent("add-child-node", {
        detail: { parentId: nodeData.id, parentType: nodeData.type },
      })
    )
  }

  const handleAddSubOpportunity = () => {
    window.dispatchEvent(
      new CustomEvent("add-child-node", {
        detail: { parentId: nodeData.id, parentType: nodeData.type, childType: "Opportunity" },
      })
    )
  }

  const getStatusColor = () => {
    switch (nodeData.status) {
      case "in-discovery":
        return "bg-blue-100 border-blue-300 text-blue-900"
      case "backlog":
        return "bg-gray-100 border-gray-300 text-gray-900"
      case "validated":
        return "bg-green-100 border-green-300 text-green-900"
      case "invalidated":
        return "bg-red-100 border-red-300 text-red-900"
      default:
        return "bg-white border-gray-200"
    }
  }

  const getStatusLabel = () => {
    switch (nodeData.status) {
      case "in-discovery":
        return "In Discovery"
      case "backlog":
        return "Backlog"
      case "validated":
        return "Validated"
      case "invalidated":
        return "Invalidated"
      default:
        return ""
    }
  }

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      
      <Card className={`w-80 p-4 border-2 shadow-md ${getStatusColor()} ${isSubOpportunity ? 'border-l-4 border-l-purple-500 bg-purple-50/50' : ''}`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Lightbulb className="w-4 h-4 flex-shrink-0" />
            <h3 className="font-medium text-sm">{nodeData.title}</h3>
          </div>
          <button 
            onClick={() => toggleOpportunityCollapse(nodeData.id)}
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
          {isSubOpportunity && (
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
              Sub-Opportunity
            </Badge>
          )}
          {nodeData.status && (
            <Badge variant="secondary" className="text-xs">
              {getStatusLabel()}
            </Badge>
          )}
          {priorityScore !== null && (
            <Badge 
              variant="outline" 
              className={`text-xs ${
                priorityScore >= 7 ? 'bg-orange-100 text-orange-700 border-orange-300' : 
                priorityScore >= 4 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 
                'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              P{priorityScore}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto">Opportunity</span>
        </div>
      </div>
    </Card>

    <Handle type="source" position={Position.Bottom} className="!bg-primary" />

    <AddChildButton
      childKind="solution"
      onAddChild={handleAddChild}
      onAddSubOpportunity={handleAddSubOpportunity}
      disabled={isLocked}
      showOpportunityMenu={true}
      canAddSubOpportunity={canAddSubOpportunity}
      canAddSolution={canAddSolution}
    />
  </div>
  )
})

OpportunityNode.displayName = "OpportunityNode"
