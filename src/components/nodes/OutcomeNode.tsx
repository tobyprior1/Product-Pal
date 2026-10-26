import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Target, BriefcaseBusiness, ArrowUpRight, Plus, ShieldCheck } from "lucide-react"
import { useUIStore } from "@/lib/pm-ui-store"
import { formatTimeframeDisplay } from "@/lib/pm-utils"
import {
  formatMetricValue,
  isGuardrailBreached,
  type OutcomeNode as OutcomeNodeType,
  type BusinessOutcomeNode,
  type ProductNorthStarNode,
} from "@/lib/pm-types"
import { AddChildButton } from "@/components/AddChildButton"
import { useDataStore } from "@/lib/pm-supabase-store"
import { Button } from "@/components/ui/button"
import { getOutcomeAlignment } from "@/lib/outcome-alignment"

const fmt = (value?: number) => (value === undefined || value === null ? "—" : `${value}`)

export const OutcomeNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as OutcomeNodeType | BusinessOutcomeNode | ProductNorthStarNode
  const business = nodeData.type === "BusinessOutcome"
  const northStar = nodeData.type === "ProductNorthStar"
  const strategic = business || northStar
  const nodes = useDataStore(s => s.nodes)
  const alignment = getOutcomeAlignment(nodes)
  const parent = nodes.find(n => n.id === nodeData.parentId)
  const product = strategic ? nodes.find(n => n.parentId === nodeData.id) : undefined
  const sample = useDataStore(s => s.currentTree?.isSample)
  const isLocked = useUIStore((state) => state.isLocked)
  const timeframe = formatTimeframeDisplay(nodeData)
  const hasMetrics =
    nodeData.baseline !== undefined ||
    nodeData.current !== undefined ||
    nodeData.target !== undefined
  const { baseline, current, target } = nodeData
  const canShowProgress =
    baseline !== undefined && current !== undefined && target !== undefined && target !== baseline
  const progress = canShowProgress ? ((current - baseline) / (target - baseline)) * 100 : 0


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
      
      <Card className={`w-80 p-4 border-2 ${northStar ? "border-north-star-border bg-north-star-surface" : business ? "border-business-outcome-border bg-business-outcome-surface" : "border-outcome-border bg-outcome-surface"}`}>
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {northStar ? <Star className="w-5 h-5 shrink-0 text-north-star" /> : business ? <BriefcaseBusiness className="w-5 h-5 shrink-0 text-business-outcome" /> : <Target className="w-5 h-5 shrink-0 text-outcome" />}
            <h3 className="font-semibold text-sm text-foreground break-words min-w-0">{nodeData.title}</h3>
          </div>
          <Badge variant="outline" className="text-xs text-foreground">
            {northStar ? "Product North Star" : business ? "Business Outcome" : "Product Outcome"}
          </Badge>
        </div>

        {(parent || product) && (
          <div className="border-t border-border pt-2 text-xs text-muted-foreground flex items-start gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span>{parent ? "Contributes to: " : "Supported by: "}{parent?.title ?? product?.title}</span>
          </div>
        )}
        {nodeData.type === "Outcome" && nodeData.businessContribution && (
          <p className="text-xs text-foreground break-words">{nodeData.businessContribution}</p>
        )}
        {!strategic && !alignment.northStar && !sample && (
          <Button variant="outline" size="sm" className="nodrag" disabled={isLocked} onClick={e => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("add-product-north-star", { detail: { outcomeId: nodeData.id } })) }}>
            <Star className="w-4 h-4 mr-1" /> Product North Star
          </Button>
        )}
        {!strategic && !alignment.business && !sample && (
          <Button variant="outline" size="sm" className="nodrag" disabled={isLocked} onClick={e => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("add-business-outcome", { detail: { outcomeId: nodeData.id } })) }}>
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
              <span>{formatMetricValue(nodeData.baseline, nodeData.metricFormat)}</span>
              <span>{formatMetricValue(nodeData.current, nodeData.metricFormat)}</span>
              <span>{formatMetricValue(nodeData.target, nodeData.metricFormat)}</span>
            </div>
            {canShowProgress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>PROGRESS</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${northStar ? "bg-north-star" : business ? "bg-business-outcome" : "bg-outcome"} transition-all duration-300`}
                    style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {nodeData.type === "Outcome" && (nodeData.guardrails?.length ?? 0) > 0 && (
          <div className="border-t border-border pt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> GUARDRAILS</span>
              {nodeData.guardrails?.some(g => isGuardrailBreached(g)) && (
                <span className="font-semibold text-destructive">Guardrail breached</span>
              )}
            </div>
            {nodeData.guardrails?.map(g => {
              const breached = isGuardrailBreached(g)
              return (
                <div key={g.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 min-w-0 text-foreground">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${breached === null ? "bg-muted-foreground" : breached ? "bg-destructive" : "bg-outcome"}`} />
                    <span className="truncate">{g.metric || "Untitled"}</span>
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {g.direction === "flat"
                      ? `${fmt(g.current)} · flat at ${fmt(g.threshold)}`
                      : `${fmt(g.current)} · keep ${g.direction} ${fmt(g.threshold)}`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>

    <Handle type="source" position={Position.Bottom} className="!bg-primary" />

    {!strategic && <AddChildButton
      childKind="opportunity"
      onAddChild={handleAddChild}
      onExtractFromInterview={handleExtractFromInterview}
      disabled={isLocked}
    />}
  </div>
  )
})

OutcomeNode.displayName = "OutcomeNode"
