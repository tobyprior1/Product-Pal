import { ArrowUpRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PanelSection } from "./node-fields/PanelSection"
import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"
import { getOutcomeAlignment } from "@/lib/outcome-alignment"
import { hierarchyStyleForNodeType } from "@/lib/pm-hierarchy"
import type { OSTNode } from "@/lib/pm-types"

export function StrategicOutcomeLinks({ node }: { node: OSTNode }) {
  const nodes = useDataStore(s => s.nodes)
  const sample = useDataStore(s => s.currentTree?.isSample)
  const isLocked = useUIStore(s => s.isLocked)
  const select = useUIStore(s => s.setSelectedNodeId)
  const { product, northStar, business } = getOutcomeAlignment(nodes)
  if (!product || !["Outcome", "ProductNorthStar", "BusinessOutcome"].includes(node.type)) return null
  const link = (target: OSTNode) => (
    <Button variant="ghost" className="w-full h-auto text-left justify-start whitespace-normal" onClick={() => select(target.id)}>
      <ArrowUpRight className={`w-4 h-4 mr-2 shrink-0 ${hierarchyStyleForNodeType(target.type).text}`} />{target.title}
    </Button>
  )
  return <>
    {node.type === "Outcome" && <PanelSection title="Product North Star">
      {northStar ? link(northStar) : <Button variant="outline" disabled={isLocked || sample} onClick={() => window.dispatchEvent(new CustomEvent("add-product-north-star", { detail: { outcomeId: product.id } }))}><Plus className="w-4 h-4 mr-2" />Add Product North Star</Button>}
    </PanelSection>}
    {node.type !== "BusinessOutcome" && <PanelSection title="Business Outcome">
      {business ? link(business) : <Button variant="outline" disabled={isLocked || sample} onClick={() => window.dispatchEvent(new CustomEvent("add-business-outcome", { detail: { outcomeId: product.id } }))}><Plus className="w-4 h-4 mr-2" />Add Business Outcome</Button>}
    </PanelSection>}
    {node.type !== "Outcome" && <PanelSection title={node.type === "BusinessOutcome" && northStar ? "Product North Star" : "Product Outcome"}>
      {link(node.type === "BusinessOutcome" && northStar ? northStar : product)}
    </PanelSection>}
  </>
}