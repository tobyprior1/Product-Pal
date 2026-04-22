import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FlaskConical } from "lucide-react"
import type { ExperimentNode as ExperimentNodeType } from "@/lib/pm-types"

export const ExperimentNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as ExperimentNodeType
  
  const getStatusColor = () => {
    switch (nodeData.status) {
      case "running":
        return "bg-blue-100 border-blue-300 text-blue-900"
      case "planned":
        return "bg-gray-100 border-gray-300 text-gray-900"
      case "completed":
        if (nodeData.decision === "ship") {
          return "bg-green-100 border-green-300 text-green-900"
        } else if (nodeData.decision === "kill") {
          return "bg-red-100 border-red-300 text-red-900"
        } else if (nodeData.decision === "iterate") {
          return "bg-yellow-100 border-yellow-300 text-yellow-900"
        }
        return "bg-purple-100 border-purple-300 text-purple-900"
      default:
        return "bg-white border-gray-200"
    }
  }

  const getStatusLabel = () => {
    if (nodeData.status === "completed" && nodeData.decision) {
      return nodeData.decision.charAt(0).toUpperCase() + nodeData.decision.slice(1)
    }
    return nodeData.status.charAt(0).toUpperCase() + nodeData.status.slice(1)
  }

  const formatDateRange = () => {
    if (!nodeData.dateRange.start) return ""
    const start = new Date(nodeData.dateRange.start).toLocaleDateString("en-US", { 
      month: "2-digit", 
      day: "2-digit", 
      year: "numeric" 
    })
    if (nodeData.dateRange.end) {
      const end = new Date(nodeData.dateRange.end).toLocaleDateString("en-US", { 
        month: "2-digit", 
        day: "2-digit", 
        year: "numeric" 
      })
      return `${start} — ${end}`
    }
    return start
  }

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      
      <Card className={`w-80 p-3 border-2 shadow-md ${getStatusColor()}`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <FlaskConical className="w-4 h-4 flex-shrink-0" />
            <h3 className="font-medium text-sm">{nodeData.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {getStatusLabel()}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">Experiment</span>
        </div>

        {nodeData.dateRange.start && (
          <p className="text-xs text-muted-foreground">{formatDateRange()}</p>
        )}
      </div>
    </Card>

    <Handle type="source" position={Position.Bottom} className="!bg-primary" style={{ opacity: 0 }} />
  </div>
  )
})

ExperimentNode.displayName = "ExperimentNode"
