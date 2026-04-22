import { Topbar } from "@/components/Topbar"
import { WorkOpportunitySection } from "@/components/WorkOpportunitySection"
import { WorkNodePanel } from "@/components/WorkNodePanel"
import { PriorityMatrixTable } from "@/components/PriorityMatrixTable"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LayoutGrid, ArrowUpDown, Filter } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculatePriorityScore } from "@/lib/pm-utils"
import { useDataStore } from "@/lib/pm-supabase-store"

type SortOption = "priority-high" | "priority-low" | "status" | "name"
type PriorityFilter = "all" | "high" | "medium" | "low" | "unassessed"

const Work = () => {
  const navigate = useNavigate()
  const nodes = useDataStore((state) => state.nodes)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("priority-high")
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [activeTab, setActiveTab] = useState<string>("list")

  const outcomes = nodes.filter((n) => n.type === "Outcome")

  const outcomeGroups = outcomes.map((outcome) => {
    let opportunities = nodes.filter(
      (n) => n.type === "Opportunity" && n.parentId === outcome.id
    ).filter((n) => {
      const opp = n as any
      return opp.status !== "invalidated"
    })

    // Apply priority filter
    if (priorityFilter !== "all") {
      opportunities = opportunities.filter((opp) => {
        const score = calculatePriorityScore(opp as any)
        if (priorityFilter === "unassessed") return score === null
        if (priorityFilter === "high") return score !== null && score >= 8 && score <= 10
        if (priorityFilter === "medium") return score !== null && score >= 4 && score <= 7
        if (priorityFilter === "low") return score !== null && score >= 1 && score <= 3
        return true
      })
    }

    // Apply sorting
    opportunities = [...opportunities].sort((a, b) => {
      if (sortBy === "priority-high") {
        const scoreA = calculatePriorityScore(a as any) ?? -1
        const scoreB = calculatePriorityScore(b as any) ?? -1
        return scoreB - scoreA
      }
      if (sortBy === "priority-low") {
        const scoreA = calculatePriorityScore(a as any) ?? 999
        const scoreB = calculatePriorityScore(b as any) ?? 999
        return scoreA - scoreB
      }
      if (sortBy === "status") {
        const statusOrder = { validated: 1, "in-discovery": 2, backlog: 3 }
        const statusA = statusOrder[(a as any).status as keyof typeof statusOrder] ?? 999
        const statusB = statusOrder[(b as any).status as keyof typeof statusOrder] ?? 999
        return statusA - statusB
      }
      if (sortBy === "name") {
        return a.title.localeCompare(b.title)
      }
      return 0
    })

    return { outcome, opportunities }
  })

  const filteredGroups = outcomeGroups.filter((group) => group.opportunities.length > 0)

  const totalOpportunities = filteredGroups.reduce((sum, group) => sum + group.opportunities.length, 0)

  const allOpportunities = nodes.filter((n) => n.type === "Opportunity").filter((n) => {
    const opp = n as any
    return opp.status !== "invalidated"
  })
  const priorityStats = {
    high: allOpportunities.filter((o) => {
      const score = calculatePriorityScore(o as any)
      return score !== null && score >= 8 && score <= 10
    }).length,
    medium: allOpportunities.filter((o) => {
      const score = calculatePriorityScore(o as any)
      return score !== null && score >= 4 && score <= 7
    }).length,
    low: allOpportunities.filter((o) => {
      const score = calculatePriorityScore(o as any)
      return score !== null && score >= 1 && score <= 3
    }).length,
    unassessed: allOpportunities.filter((o) => calculatePriorityScore(o as any) === null).length,
  }

  const handleItemClick = (nodeId: string) => {
    setSelectedNodeId(nodeId)
  }

  return (
    <div className="h-screen flex flex-col">
      <Topbar />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1">Work View</h1>
                <p className="text-sm text-muted-foreground">
                  {totalOpportunities} active opportunit{totalOpportunities !== 1 ? "ies" : "y"} across{" "}
                  {filteredGroups.length} outcome
                  {filteredGroups.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === "list" && (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <ArrowUpDown className="w-4 h-4" />
                          Sort
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                          <DropdownMenuRadioItem value="priority-high">Priority (High to Low)</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="priority-low">Priority (Low to High)</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="name">Name (A-Z)</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Filter className="w-4 h-4" />
                          Filter
                          {priorityFilter !== "all" && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                              {priorityFilter === "unassessed"
                                ? priorityStats.unassessed
                                : priorityFilter === "high"
                                  ? priorityStats.high
                                  : priorityFilter === "medium"
                                    ? priorityStats.medium
                                    : priorityStats.low}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup
                          value={priorityFilter}
                          onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}
                        >
                          <DropdownMenuRadioItem value="all">
                            All Opportunities ({allOpportunities.length})
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="high">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              High Priority (P8-P10)
                              <span className="ml-auto text-muted-foreground">({priorityStats.high})</span>
                            </span>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="medium">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                              Medium Priority (P4-P7)
                              <span className="ml-auto text-muted-foreground">({priorityStats.medium})</span>
                            </span>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="low">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              Low Priority (P1-P3)
                              <span className="ml-auto text-muted-foreground">({priorityStats.low})</span>
                            </span>
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="unassessed">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                              Unassessed
                              <span className="ml-auto text-muted-foreground">({priorityStats.unassessed})</span>
                            </span>
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/editor")}
                  className="gap-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Tree View
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="matrix">Priority Matrix</TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-0">
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                      <LayoutGrid className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">
                      {priorityFilter === "all" ? "No active opportunities" : "No opportunities match this filter"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {priorityFilter === "all"
                        ? "Add opportunities to your tree to see them here."
                        : "Try adjusting your filter settings."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {filteredGroups.map(({ outcome, opportunities }) => (
                      <div key={outcome.id}>
                        <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h2 className="text-lg font-bold mb-1">{outcome.title}</h2>
                              {outcome.current !== undefined && outcome.target !== undefined && (
                                <p className="text-sm text-muted-foreground">
                                  Current: {outcome.current}% → Target: {outcome.target}%
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {opportunities.length} opportunit{opportunities.length !== 1 ? "ies" : "y"}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {opportunities.map((opportunity) => (
                            <WorkOpportunitySection
                              key={opportunity.id}
                              opportunity={opportunity as any}
                              onItemClick={handleItemClick}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="matrix" className="mt-0">
                <PriorityMatrixTable />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {selectedNodeId && <WorkNodePanel nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} />}
      </div>
    </div>
  )
}

export default Work
