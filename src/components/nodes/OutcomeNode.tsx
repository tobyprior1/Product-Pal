import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target } from "lucide-react"
import { useUIStore } from "@/lib/pm-ui-store"
import { formatTimeframeDisplay } from "@/lib/pm-utils"
import type { OutcomeNode as OutcomeNodeType } from "@/lib/pm-types"
import { AddChildButton } from "@/components/AddChildButton"

export const OutcomeNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as OutcomeNodeType
  const isLocked = useUIStore((state) => state.isLocked)
  const timeframe = formatTimeframeDisplay(nodeData)
  const progress = nodeData.baseline && nodeData.current && nodeData.target 
    ? ((nodeData.current - nodeData.baseline) / (nodeData.target - nodeData.baseline)) * 100
    : 0

  const handleAddChild = () => {
    window.dispatchEvent(
      new CustomEvent("add-child-node", {
        detail: { parentId: nodeData.id, parentType: nodeData.type },
      })
    )
  }

  return (
    <div className="relative group">
      <Handle type="target" position={Position.Top} className="!bg-primary" style={{ opacity: 0 }} />
      
      <Card className="w-80 p-4 border-2 border-purple-300 bg-purple-50 shadow-lg">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-sm text-gray-900">{nodeData.title}</h3>
          </div>
          <Badge variant="outline" className="text-xs text-gray-700">
            Outcome
          </Badge>
        </div>

        {timeframe && (
          <p className="text-xs text-gray-600">{timeframe}</p>
        )}

        {nodeData.metric && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">BASELINE</span>
              <span className="text-gray-500">CURRENT</span>
              <span className="text-gray-500">TARGET</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-900">
              <span>{nodeData.baseline}%</span>
              <span>{nodeData.current}%</span>
              <span>{nodeData.target}%</span>
            </div>
            {progress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>PROGRESS</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-400 transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
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

OutcomeNode.displayName = "OutcomeNode"
