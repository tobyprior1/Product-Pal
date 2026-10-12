import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, BriefcaseBusiness, ArrowUpRight, Plus } from "lucide-react"
import { useUIStore } from "@/lib/pm-ui-store"
import { formatTimeframeDisplay } from "@/lib/pm-utils"
import type { OutcomeNode as OutcomeNodeType, BusinessOutcomeNode } from "@/lib/pm-types"
import { AddChildButton } from "@/components/AddChildButton"
import { useDataStore } from "@/lib/pm-supabase-store"
import { Button } from "@/components/ui/button"

const fmt = (value?: number) => (value === undefined || value === null ? "—" : `${value}`)

export const OutcomeNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as OutcomeNodeType | BusinessOutcomeNode
  const business = nodeData.type === "BusinessOutcome"
  const nodes = useDataStore(s => s.nodes)
  const parent = nodes.find(n => n.id === nodeData.parentId && n.type === "BusinessOutcome")
  const product = business ? nodes.find(n => n.parentId === nodeData.id && n.type === "Outcome") : undefined
  const sample = useDataStore(s => s.currentTree?.isSample)
  const isLocked = useUIStore((state) => state.isLocked)
  const timeframe = formatTimeframeDisplay(nodeData)
  const hasMetrics =
    nodeData.baseline !== undefined ||
    nodeData.current !== undefined ||
    nodeData.target !== undefined
  const { baseline, current, target } = nodeData
  const progress = baseline !== undefined && current !== undefined && target !== undefined && target !== baseline
    ? ((current - baseline) / (target - baseline)) * 100 : 0


  const handleAddChild = () => {
    window.dispatchEvent(
      new CustomEvent("add-child-node", {
        detail: { parentId: nodeData.id, parentType: nodeData.type },
      })
    )
  }

  const handleExtractFromInterview = () => {
    window.dispatchEvent(
      new CustomEvent("extract-opportunities", { detail: { parentId: nodeData.id } })
    )
  }

  return (
    <div className="relative group" data-tour="node-outcome">
      <Handle type="target" position={Position.Top} className="!bg-primary" style={{ opacity: 0 }} />
      
      <Card className={`w-80 p-4 border-2 ${business ? "border-business-outcome-border bg-business-outcome-surface" : "border-outcome-border bg-outcome-surface"}`}>
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {business ? <BriefcaseBusiness className="w-5 h-5 shrink-0 text-business-outcome" /> : <Target className="w-5 h-5 shrink-0 text-outcome" />}
            <h3 className="font-semibold text-sm text-foreground">{nodeData.title}</h3>
          </div>
          <Badge variant="outline" className="text-xs text-foreground">
            {business ? "Business Outcome" : "Product Outcome"}
          </Badge>
        </div>

        {(parent || product) && (
          <div className="border-t border-border pt-2 text-xs text-muted-foreground flex items-start gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span>{business ? "Supported by: " : "Contributes to: "}{parent?.title ?? product?.title}</span>
          </div>
        )}
        {nodeData.type === "Outcome" && nodeData.businessContribution && (
          <p className="text-xs text-foreground break-words">{nodeData.businessContribution}</p>
        )}
        {!business && !parent && !sample && (
          <Button variant="outline" size="sm" className="nodrag" disabled={isLocked} onClick={() => window.dispatchEvent(new CustomEvent("add-business-outcome", { detail: { outcomeId: nodeData.id } }))}>
            <Plus className="w-4 h-4 mr-1" /> Business Outcome
          </Button>
        )}
        {timeframe && (
          <p className="text-xs text-muted-foreground">{timeframe}</p>
        )}

        {nodeData.metric && (
          <p className="text-xs font-medium text-foreground">{nodeData.metric}</p>
        )}

        {hasMetrics && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">BASELINE</span>
              <span className="text-muted-foreground">CURRENT</span>
              <span className="text-muted-foreground">TARGET</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-foreground">
              <span>{fmt(nodeData.baseline)}</span>
              <span>{fmt(nodeData.current)}</span>
              <span>{fmt(nodeData.target)}</span>
            </div>
            {progress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>PROGRESS</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-outcome transition-all duration-300"
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

    {!business && <AddChildButton
      childKind="opportunity"
      onAddChild={handleAddChild}
      onExtractFromInterview={handleExtractFromInterview}
      disabled={isLocked}
    />}
  </div>
  )
})

OutcomeNode.displayName = "OutcomeNode"
