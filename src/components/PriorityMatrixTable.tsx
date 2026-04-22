import { useDataStore } from "@/lib/pm-supabase-store"
import type { OpportunityNode } from "@/lib/pm-types"
import { calculatePriorityScore, getPriorityBadgeColor, getPriorityLabel } from "@/lib/pm-utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SortField = "name" | "reach" | "confidence" | "impact" | "priority"
type SortDirection = "asc" | "desc"

export function PriorityMatrixTable() {
  const nodes = useDataStore((state) => state.nodes)
  const updateNode = useDataStore((state) => state.updateNode)
  const [sortField, setSortField] = useState<SortField>("priority")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const opportunities = nodes.filter((n) => {
    if (n.type !== "Opportunity") return false
    if (n.status === "invalidated") return false
    if (statusFilter === "all") return true
    return n.status === statusFilter
  }) as OpportunityNode[]

  const opportunitiesWithContext = opportunities.map((opp) => {
    let currentNode = opp
    let outcome = null

    while (currentNode.parentId) {
      const parent = nodes.find((n) => n.id === currentNode.parentId)
      if (!parent) break
      if (parent.type === "Outcome") {
        outcome = parent
        break
      }
      currentNode = parent as OpportunityNode
    }

    return { opportunity: opp, outcome }
  })

  const sortedOpportunities = [...opportunitiesWithContext].sort((a, b) => {
    let aValue: number | string = 0
    let bValue: number | string = 0

    if (sortField === "name") {
      aValue = a.opportunity.title.toLowerCase()
      bValue = b.opportunity.title.toLowerCase()
    } else if (sortField === "reach") {
      aValue = a.opportunity.reach ?? -1
      bValue = b.opportunity.reach ?? -1
    } else if (sortField === "confidence") {
      aValue = a.opportunity.confidence ?? -1
      bValue = b.opportunity.confidence ?? -1
    } else if (sortField === "impact") {
      aValue = a.opportunity.impact ?? -1
      bValue = b.opportunity.impact ?? -1
    } else if (sortField === "priority") {
      aValue = calculatePriorityScore(a.opportunity) ?? -1
      bValue = calculatePriorityScore(b.opportunity) ?? -1
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return sortDirection === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection(field === "name" ? "asc" : "desc")
    }
  }

  const handleScoreChange = (opportunityId: string, field: "reach" | "confidence" | "impact", value: string) => {
    const numValue = Number.parseInt(value)
    if (isNaN(numValue) || numValue < 1 || numValue > 10) return

    updateNode(opportunityId, { [field]: numValue })
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="in-discovery">In Discovery</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="validated">Validated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {opportunities.length} {opportunities.length === 1 ? "opportunity" : "opportunities"}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-background z-10 border-b">
            <tr>
              <th
                className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Opportunity
                  <SortIcon field="name" />
                </div>
              </th>
              <th className="text-left p-3 font-medium">Outcome</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th
                className="text-center p-3 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort("reach")}
              >
                <div className="flex items-center justify-center gap-2">
                  Reach
                  <SortIcon field="reach" />
                </div>
              </th>
              <th
                className="text-center p-3 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort("confidence")}
              >
                <div className="flex items-center justify-center gap-2">
                  Confidence
                  <SortIcon field="confidence" />
                </div>
              </th>
              <th
                className="text-center p-3 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort("impact")}
              >
                <div className="flex items-center justify-center gap-2">
                  Impact
                  <SortIcon field="impact" />
                </div>
              </th>
              <th
                className="text-center p-3 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort("priority")}
              >
                <div className="flex items-center justify-center gap-2">
                  Priority
                  <SortIcon field="priority" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedOpportunities.map(({ opportunity, outcome }) => {
              const priorityScore = calculatePriorityScore(opportunity)
              const priorityBadgeColor = getPriorityBadgeColor(priorityScore)
              const priorityLabel = getPriorityLabel(priorityScore)

              return (
                <tr key={opportunity.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="font-medium">{opportunity.title}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-muted-foreground">{outcome?.title || "—"}</div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {opportunity.status?.replace("-", " ") || "—"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={opportunity.reach ?? ""}
                      onChange={(e) => handleScoreChange(opportunity.id, "reach", e.target.value)}
                      placeholder="—"
                      className="w-16 text-center mx-auto"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={opportunity.confidence ?? ""}
                      onChange={(e) => handleScoreChange(opportunity.id, "confidence", e.target.value)}
                      placeholder="—"
                      className="w-16 text-center mx-auto"
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={opportunity.impact ?? ""}
                      onChange={(e) => handleScoreChange(opportunity.id, "impact", e.target.value)}
                      placeholder="—"
                      className="w-16 text-center mx-auto"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col items-center gap-1">
                      {priorityScore !== null ? (
                        <>
                          <div className="text-lg font-semibold">{priorityScore}</div>
                          <Badge variant="outline" className={`${priorityBadgeColor} text-xs`}>
                            {priorityLabel}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {opportunities.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No opportunities to assess</p>
          </div>
        )}
      </div>
    </div>
  )
}
