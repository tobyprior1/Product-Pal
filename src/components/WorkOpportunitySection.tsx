import { useState } from "react"
import type { OSTNode, OpportunityNode } from "@/lib/pm-types"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDataStore } from "@/lib/pm-supabase-store"
import { calculatePriorityScore, getPriorityBadgeColor } from "@/lib/pm-utils"

interface WorkOpportunitySectionProps {
  opportunity: OpportunityNode
  onItemClick: (nodeId: string) => void
  depth?: number
}

export function WorkOpportunitySection({ opportunity, onItemClick, depth = 0 }: WorkOpportunitySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const getNodeChildren = useDataStore((state) => state.getNodeChildren)
  const getOpportunityStats = useDataStore((state) => state.getOpportunityStats)

  const children = getNodeChildren(opportunity.id)
  const subOpportunities = children.filter(
    (n) => n.type === "Opportunity" && (n as any).status !== "invalidated",
  )
  const allSolutions = children.filter((n) => n.type === "Solution" && n.status !== "Done")


  const timeframePriority: Record<string, number> = {
    Now: 1,
    Next: 2,
    Later: 3,
    Planned: 4,
    Backlog: 5,
  }

  const solutions = allSolutions.sort((a, b) => {
    const priorityA = timeframePriority[(a as any).status || "Backlog"] || 999
    const priorityB = timeframePriority[(b as any).status || "Backlog"] || 999
    return priorityA - priorityB
  })

  const directExperiments = children.filter((n) => n.type === "Experiment").filter((n) => {
    const exp = n as any
    return exp.status !== "completed"
  })

  const stats = getOpportunityStats(opportunity.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "backlog":
        return "bg-gray-100 text-gray-700 border-gray-200"
      case "in-discovery":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "validated":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")
  }

  const getHealthIndicator = () => {
    if (opportunity.status === "validated" && stats.solutionsCount > 0) {
      return { color: "bg-green-500", label: "Healthy" }
    }
    if (opportunity.status === "in-discovery" && stats.experimentsRunning > 0) {
      return { color: "bg-yellow-500", label: "Active Discovery" }
    }
    if (opportunity.status === "backlog") {
      return { color: "bg-gray-400", label: "Not Started" }
    }
    if (stats.solutionsCount === 0 && stats.experimentsCount === 0) {
      return { color: "bg-red-500", label: "Needs Attention" }
    }
    return { color: "bg-blue-500", label: "In Progress" }
  }

  const health = getHealthIndicator()

  const priorityScore = calculatePriorityScore(opportunity)

  return (
    <div className="border border-border border-l-4 border-l-purple-500 rounded-lg overflow-hidden bg-card">
      {/* Opportunity Header */}
      <div className="flex">
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-4 hover:bg-accent/50 transition-colors">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        <button
          onClick={() => onItemClick(opportunity.id)}
          className="flex-1 p-4 pl-0 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-purple-600" />
          </div>


          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <h3 className="font-semibold text-base leading-tight flex-1">{opportunity.title}</h3>

              <div className="flex items-center gap-2 shrink-0">
                <div className={cn("w-2 h-2 rounded-full", health.color)} title={health.label} />
                {priorityScore !== null && (
                  <Badge className={cn("text-xs font-semibold", getPriorityBadgeColor(priorityScore))}>
                    P{priorityScore}
                  </Badge>
                )}
                <Badge variant="outline" className={cn("text-xs", getStatusColor(opportunity.status || ""))}>
                  {capitalizeStatus(opportunity.status || "")}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {stats.solutionsCount} solution{stats.solutionsCount !== 1 ? "s" : ""}
              </span>
              <span>
                {stats.experimentsCount} experiment{stats.experimentsCount !== 1 ? "s" : ""}
              </span>
              {stats.solutionsInProgress > 0 && (
                <span className="text-blue-600 font-medium">{stats.solutionsInProgress} in progress</span>
              )}
              {stats.experimentsRunning > 0 && (
                <span className="text-amber-600 font-medium">{stats.experimentsRunning} running</span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (solutions.length > 0 || directExperiments.length > 0 || subOpportunities.length > 0) && (
        <div className="border-t border-border bg-muted/30">
          <div className="p-4 space-y-2">
            {/* Sub-opportunities */}
            {subOpportunities.length > 0 && (
              <div className="space-y-2 mb-2">
                {subOpportunities.map((sub) => (
                  <WorkOpportunitySection
                    key={sub.id}
                    opportunity={sub as any}
                    onItemClick={onItemClick}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}

            {/* Solutions */}
            {solutions.map((solution) => {
              const solutionExperiments = getNodeChildren(solution.id).filter(
                (n) => n.type === "Experiment" && n.status !== "completed",
              )
              return (
                <div key={solution.id} className="space-y-2">
                  <button
                    onClick={() => onItemClick(solution.id)}
                    className="w-full p-3 rounded-md border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span className="font-medium text-sm leading-snug flex-1 group-hover:text-primary transition-colors">
                        {solution.title}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0 bg-blue-50 text-blue-700 border-blue-200">
                        {capitalizeStatus((solution as any).status || "")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-blue-600">Solution</span>
                      {solutionExperiments.length > 0 && <span>• {solutionExperiments.length} active experiments</span>}
                    </div>
                  </button>

                  {/* Experiments under this solution */}
                  {solutionExperiments.length > 0 && (
                    <div className="ml-6 space-y-1">
                      {solutionExperiments.map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => onItemClick(exp.id)}
                          className="w-full p-2 rounded-md border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm leading-snug flex-1 group-hover:text-primary transition-colors">
                              {exp.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0 bg-amber-50 text-amber-700 border-amber-200"
                            >
                              {capitalizeStatus((exp as any).status || "")}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-amber-600">Experiment</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Direct experiments (not under solutions) */}
            {directExperiments.map((exp) => (
              <button
                key={exp.id}
                onClick={() => onItemClick(exp.id)}
                className="w-full p-3 rounded-md border border-border bg-card hover:bg-accent/50 transition-colors text-left group"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <span className="font-medium text-sm leading-snug flex-1 group-hover:text-primary transition-colors">
                    {exp.title}
                  </span>
                  <Badge variant="outline" className="text-xs shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                    {capitalizeStatus((exp as any).status || "")}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-amber-600">Experiment</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {isExpanded && solutions.length === 0 && directExperiments.length === 0 && subOpportunities.length === 0 && (
        <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
          No active sub-opportunities, solutions or experiments
        </div>
      )}
    </div>
  )
}
