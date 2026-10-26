import { BriefcaseBusiness, ArrowUpRight } from "lucide-react"
import { useDataStore } from "@/lib/pm-supabase-store"
import { getOutcomeAlignment } from "@/lib/outcome-alignment"
import { hierarchyStyleForNodeType } from "@/lib/pm-hierarchy"

export function BusinessOutcomeSummary() {
  const nodes = useDataStore(s => s.nodes)
  const { product, business, northStar } = getOutcomeAlignment(nodes)
  if ((!business && !northStar) || !product || product.type !== "Outcome") return null
  return (
    <div className="mb-4 border-l-2 border-business-outcome-border pl-3 space-y-1">
      {[business, northStar].filter(n => n !== undefined).map(goal => {
        const style = hierarchyStyleForNodeType(goal.type)
        const Icon = style.icon
        return <div key={goal.id} className="space-y-1">
          <div className={`flex items-center gap-2 text-xs font-medium ${style.text}`}><Icon className="w-4 h-4" />{style.label}</div>
          <p className="text-sm font-semibold text-foreground break-words">{goal.title}</p>
          {goal.type === "ProductNorthStar" && goal.timeframePeriodValue && <p className="text-xs text-muted-foreground">{goal.timeframePeriodValue}</p>}
        </div>
      })}
      <p className="text-xs text-muted-foreground flex gap-1"><ArrowUpRight className="w-3.5 h-3.5 shrink-0" /><span>Product Outcome: {product.title}</span></p>
      {product.businessContribution && <p className="text-xs text-muted-foreground break-words">{product.businessContribution}</p>}
    </div>
  )
}