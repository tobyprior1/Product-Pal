import { useState } from "react"
import type { OSTNode, OpportunityNode } from "@/lib/pm-types"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDataStore } from "@/lib/pm-supabase-store"
import { calculatePriorityScore, getPriorityBadgeColor } from "@/lib/pm-utils"
import { HIERARCHY_STYLES, type HierarchyKind } from "@/lib/pm-hierarchy"

interface WorkOpportunitySectionProps {
  opportunity: OpportunityNode
  onItemClick: (nodeId: string) => void
  depth?: number
}

const capitalizeStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")

/** Timeframe ordering used to sort solutions inside an opportunity. */
const TIMEFRAME_PRIORITY: Record<string, number> = {
  Now: 1,
  Next: 2,
  Later: 3,
  Planned: 4,
  Backlog: 5,
}

interface HierarchyItemButtonProps {
  kind: Extract<HierarchyKind, "solution" | "experiment">
  node: OSTNode
  onClick: () => void
  /** Experiments nested under a solution render slightly smaller. */
  compact?: boolean
  meta?: string
}

/** Shared row used for solutions and experiments so both follow the same colour language. */
function HierarchyItemButton({ kind, node, onClick, compact = false, meta }: HierarchyItemButtonProps) {
  const style = HIERARCHY_STYLES[kind]
  const Icon = style.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-md border border-border border-l-4 bg-card hover:bg-accent/50 transition-colors text-left group flex items-start",
        style.accentBorder,
        compact ? "p-2 gap-2" : "p-3 gap-3",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center shrink-0",
          style.iconBg,
          compact ? "w-6 h-6 rounded" : "w-7 h-7 rounded-md",
        )}
      >
        <Icon className={cn(style.text, compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("flex items-start justify-between gap-3", compact ? undefined : "mb-1")}>
          <span
            className={cn(
              "text-sm leading-snug flex-1 group-hover:text-primary transition-colors",
              !compact && "font-medium",
            )}
          >
            {node.title}
          </span>
          <Badge variant="outline" className={cn("text-xs shrink-0", style.badge)}>
            {capitalizeStatus((node as any).status || "")}
          </Badge>
        </div>
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", compact && "mt-0.5")}>
          <span className={cn("text-[10px] font-semibold uppercase tracking-wide", style.text)}>{style.label}</span>
          {meta && <span>• {meta}</span>}
        </div>
      </div>
    </button>
  )
}

export function WorkOpportunitySection({ opportunity, onItemClick, depth = 0 }: WorkOpportunitySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const getNodeChildren = useDataStore((state) => state.getNodeChildren)
  const getOpportunityStats = useDataStore((state) => state.getOpportunityStats)

  const children = getNodeChildren(opportunity.id)
  const subOpportunities = children.filter((n) => n.type === "Opportunity" && (n as any).status !== "invalidated")

  const solutions = children
    .filter((n) => n.type === "Solution" && n.status !== "Done")
    .sort(
      (a, b) =>
        (TIMEFRAME_PRIORITY[(a as any).status || "Backlog"] || 999) -
        (TIMEFRAME_PRIORITY[(b as any).status || "Backlog"] || 999),
    )

  const directExperiments = children.filter((n) => n.type === "Experiment" && (n as any).status !== "completed")

  const stats = getOpportunityStats(opportunity.id)
  const opportunityStyle = HIERARCHY_STYLES.opportunity
  const OpportunityIcon = opportunityStyle.icon

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-discovery":
        return opportunityStyle.badge
      case "validated":
        return "bg-green-100 text-green-700 border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
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
  const hasChildren = solutions.length > 0 || directExperiments.length > 0 || subOpportunities.length > 0

  return (
    <div className={cn("border border-border border-l-4 rounded-lg overflow-hidden bg-card", opportunityStyle.accentBorder)}>
      {/* Opportunity header */}
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
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", opportunityStyle.iconBg)}>
            <OpportunityIcon className={cn("w-5 h-5", opportunityStyle.text)} />
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

            <div className={cn("text-[10px] font-semibold uppercase tracking-wide mb-1", opportunityStyle.text)}>
              {depth > 0 ? "Sub-opportunity" : opportunityStyle.label}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {stats.solutionsCount} solution{stats.solutionsCount !== 1 ? "s" : ""}
              </span>
              <span>
                {stats.experimentsCount} experiment{stats.experimentsCount !== 1 ? "s" : ""}
              </span>
              {stats.solutionsInProgress > 0 && (
                <span className={cn("font-medium", HIERARCHY_STYLES.solution.text)}>
                  {stats.solutionsInProgress} in progress
                </span>
              )}
              {stats.experimentsRunning > 0 && (
                <span className={cn("font-medium", HIERARCHY_STYLES.experiment.text)}>
                  {stats.experimentsRunning} running
                </span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && hasChildren && (
        <div className="border-t border-border bg-muted/30">
          <div className="p-4 space-y-2">
            {/* Sub-opportunities */}
            {subOpportunities.length > 0 && (
              <div className="space-y-2 mb-2">
                {subOpportunities.map((sub) => (
                  <WorkOpportunitySection
                    key={sub.id}
                    opportunity={sub as OpportunityNode}
                    onItemClick={onItemClick}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}

            {/* Solutions with their experiments */}
            {solutions.map((solution) => {
              const solutionExperiments = getNodeChildren(solution.id).filter(
                (n) => n.type === "Experiment" && n.status !== "completed",
              )

              return (
                <div key={solution.id} className="space-y-2">
                  <HierarchyItemButton
                    kind="solution"
                    node={solution}
                    onClick={() => onItemClick(solution.id)}
                    meta={
                      solutionExperiments.length > 0
                        ? `${solutionExperiments.length} active experiments`
                        : undefined
                    }
                  />

                  {solutionExperiments.length > 0 && (
                    <div className="ml-8 space-y-1">
                      {solutionExperiments.map((exp) => (
                        <HierarchyItemButton
                          key={exp.id}
                          kind="experiment"
                          node={exp}
                          compact
                          onClick={() => onItemClick(exp.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Experiments attached directly to the opportunity */}
            {directExperiments.map((exp) => (
              <HierarchyItemButton
                key={exp.id}
                kind="experiment"
                node={exp}
                onClick={() => onItemClick(exp.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {isExpanded && !hasChildren && (
        <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
          No active sub-opportunities, solutions or experiments
        </div>
      )}
    </div>
  )
}
