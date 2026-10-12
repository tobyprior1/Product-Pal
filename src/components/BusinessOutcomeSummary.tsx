import { BriefcaseBusiness, ArrowUpRight } from "lucide-react"
import { useDataStore } from "@/lib/pm-supabase-store"

export function BusinessOutcomeSummary() {
  const nodes = useDataStore(s => s.nodes)
  const product = nodes.find(n => n.type === "Outcome")
  const business = nodes.find(n => n.id === product?.parentId && n.type === "BusinessOutcome")
  if (!business || !product || product.type !== "Outcome") return null
  return (
    <div className="mb-4 border-l-2 border-business-outcome-border pl-3 space-y-1">
      <div className="flex items-center gap-2 text-xs font-medium text-business-outcome"><BriefcaseBusiness className="w-4 h-4" />Business Outcome</div>
      <p className="text-sm font-semibold text-foreground break-words">{business.title}</p>
      <p className="text-xs text-muted-foreground flex gap-1"><ArrowUpRight className="w-3.5 h-3.5 shrink-0" /><span>Product Outcome: {product.title}</span></p>
      {product.businessContribution && <p className="text-xs text-muted-foreground break-words">{product.businessContribution}</p>}
    </div>
  )
}