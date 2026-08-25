import { useDataStore } from "@/lib/pm-supabase-store"
import type { SolutionNode, ExperimentNode, OutcomeNode, OpportunityNode } from "@/lib/pm-types"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, Target, Lightbulb, Zap, FlaskConical } from "lucide-react"
import { useState } from "react"
import { calculateWeeks, groupWeeks, findWeekIndex, calculateBarPosition } from "@/lib/pm-gantt-utils"
import { GanttHeader } from "./gantt/GanttHeader"
import { GanttTimelineBar } from "./gantt/GanttTimelineBar"
import { GanttGridRow } from "./gantt/GanttGridRow"

interface GanttChartProps {
  onItemClick: (nodeId: string) => void
}

const capitalizeStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function GanttChart({ onItemClick }: GanttChartProps) {
  const nodes = useDataStore((state) => state.nodes)
  const getNodeChildren = useDataStore((state) => state.getNodeChildren)
  const [expandedSolutions, setExpandedSolutions] = useState<Set<string>>(new Set())
  const [hiddenWeeks, setHiddenWeeks] = useState<Set<number>>(() => {
    const solutions = nodes.filter((n) => n.type === "Solution") as SolutionNode[]
    const activeSolutions = solutions.filter((s) => s.startDate && s.status !== "Done")

    if (activeSolutions.length === 0) {
      return new Set()
    }

    const earliestDate = new Date(Math.min(...activeSolutions.map((s) => new Date(s.startDate!).getTime())))

    const allDates: Date[] = []
    nodes.forEach((node) => {
      if (node.type === "Solution" && node.startDate) {
        allDates.push(new Date(node.startDate))
        if (node.endDate) allDates.push(new Date(node.endDate))
      }
      if (node.type === "Experiment" && node.dateRange?.start) {
        allDates.push(new Date(node.dateRange.start))
        if (node.dateRange.end) allDates.push(new Date(node.dateRange.end))
      }
    })

    if (allDates.length === 0) {
      return new Set()
    }

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const weeks = calculateWeeks(minDate, new Date(Math.max(...allDates.map((d) => d.getTime()))))

    const hidden = new Set<number>()
    const earliestWeekIndex = findWeekIndex(weeks, earliestDate)

    for (let i = 0; i < earliestWeekIndex; i++) {
      hidden.add(i)
    }

    return hidden
  })

  const outcomes = nodes.filter((n) => n.type === "Outcome") as OutcomeNode[]

  const allDates: Date[] = []
  nodes.forEach((node) => {
    if (node.type === "Solution" && node.startDate) {
      allDates.push(new Date(node.startDate))
      if (node.endDate) allDates.push(new Date(node.endDate))
    }
    if (node.type === "Experiment" && node.dateRange?.start) {
      allDates.push(new Date(node.dateRange.start))
      if (node.dateRange.end) allDates.push(new Date(node.dateRange.end))
    }
  })

  if (allDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No timeline data available</p>
          <p className="text-sm mt-2">Add start and end dates to solutions and experiments to see the Gantt chart</p>
        </div>
      </div>
    )
  }

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))
  const weeks = calculateWeeks(minDate, maxDate)
  const weekGroups = groupWeeks(weeks, hiddenWeeks)

  const toggleSolution = (solutionId: string) => {
    const newExpanded = new Set(expandedSolutions)
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId)
    } else {
      newExpanded.add(solutionId)
    }
    setExpandedSolutions(newExpanded)
  }

  const expandHiddenGroup = (startIndex: number, endIndex: number) => {
    const newHidden = new Set(hiddenWeeks)
    for (let i = startIndex; i <= endIndex; i++) {
      newHidden.delete(i)
    }
    setHiddenWeeks(newHidden)
  }

  const toggleWeekVisibility = (weekIndex: number) => {
    const newHidden = new Set(hiddenWeeks)
    if (newHidden.has(weekIndex)) {
      newHidden.delete(weekIndex)
    } else {
      newHidden.add(weekIndex)
    }
    setHiddenWeeks(newHidden)
  }

  // Helper to get all opportunities under an outcome
  const getAllOpportunitiesUnderOutcome = (outcomeId: string): OpportunityNode[] => {
    const opportunities: OpportunityNode[] = []
    
    const findOpportunities = (parentId: string) => {
      const children = getNodeChildren(parentId)
      children.forEach((child) => {
        if (child.type === "Opportunity") {
          opportunities.push(child as OpportunityNode)
          findOpportunities(child.id)
        }
      })
    }
    
    findOpportunities(outcomeId)
    return opportunities
  }

  // Solutions that belong on the roadmap (dated ones first)
  const getRoadmapSolutions = (opportunityId: string): SolutionNode[] => {
    const solutions = getNodeChildren(opportunityId).filter((n) => n.type === "Solution") as SolutionNode[]
    return solutions
      .filter((s) => s.status !== "Done" && s.status !== "Backlog")
      .sort((a, b) => {
        if (a.startDate && b.startDate) return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        if (a.startDate) return -1
        if (b.startDate) return 1
        return a.title.localeCompare(b.title)
      })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Labels column */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-border">
          <div className="h-12 px-3 border-b border-border bg-muted/30 font-medium sticky top-0 z-10 flex items-center">
            Item
          </div>

          <div className="flex-1 overflow-y-auto">
            {outcomes.map((outcome) => {
              const opportunities = getAllOpportunitiesUnderOutcome(outcome.id)

              return (
                <div key={outcome.id} className="border-b-2 border-border">
                  <button
                    onClick={() => onItemClick(outcome.id)}
                    className="w-full bg-purple-50 dark:bg-purple-950/30 border-l-4 border-l-purple-400 px-2 border-b border-border h-[41px] flex items-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-950/50 text-left transition-colors cursor-pointer"
                  >
                    <Target className="w-4 h-4 flex-shrink-0 text-purple-600 dark:text-purple-300" />
                    <span className="font-semibold text-sm uppercase tracking-wide truncate">{outcome.title}</span>
                  </button>

                  {opportunities.map((opportunity) => {
                    const roadmapSolutions = getRoadmapSolutions(opportunity.id)

                    return (
                      <div key={opportunity.id}>
                        <button
                          onClick={() => onItemClick(opportunity.id)}
                          className="w-full bg-amber-50/60 dark:bg-amber-950/20 border-l-4 border-l-amber-300 px-2 text-sm border-b border-border pl-4 h-[41px] flex items-center gap-2 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-left transition-colors cursor-pointer"
                        >
                          <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-300" />
                          <span className="font-medium truncate">{opportunity.title}</span>
                        </button>

                        {roadmapSolutions.length === 0 && (
                          <div className="px-2 pl-10 h-[41px] flex items-center border-b border-border border-l-4 border-l-transparent text-xs text-muted-foreground italic">
                            No scheduled solutions
                          </div>
                        )}

                        {roadmapSolutions.map((solution) => {
                          const experiments = getNodeChildren(solution.id).filter(
                            (n) => n.type === "Experiment",
                          ) as ExperimentNode[]
                          const experimentsWithDates = experiments.filter(
                            (e) => e.dateRange?.start && e.status !== "backlog",
                          )
                          const isExpanded = expandedSolutions.has(solution.id)

                          return (
                            <div key={solution.id}>
                              <div className="px-2 pl-8 border-b border-border border-l-4 border-l-blue-300 flex items-center gap-2 h-12 hover:bg-muted/50">
                                {experimentsWithDates.length > 0 ? (
                                  <button
                                    onClick={() => toggleSolution(solution.id)}
                                    className="flex-shrink-0 hover:bg-muted rounded p-0.5"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="w-5 flex-shrink-0" />
                                )}
                                <Zap className="w-3.5 h-3.5 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                                <button
                                  onClick={() => onItemClick(solution.id)}
                                  className="flex-1 text-left hover:text-primary text-sm truncate"
                                >
                                  {solution.title}
                                </button>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {capitalizeStatus(solution.status || "")}
                                </Badge>
                              </div>

                              {isExpanded &&
                                experimentsWithDates.map((experiment) => (
                                  <div
                                    key={experiment.id}
                                    className="px-2 pl-16 border-b border-border border-l-4 border-l-teal-200 flex items-center gap-2 h-12 hover:bg-muted/50"
                                  >
                                    <FlaskConical className="w-3 h-3 flex-shrink-0 text-teal-600 dark:text-teal-300" />
                                    <button
                                      onClick={() => onItemClick(experiment.id)}
                                      className="flex-1 text-left hover:text-primary text-xs text-muted-foreground truncate"
                                    >
                                      {experiment.title}
                                    </button>
                                    <Badge variant="outline" className="text-[10px] flex-shrink-0">
                                      {capitalizeStatus(experiment.status)}
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>

              )
            })}
          </div>
        </div>

        {/* Timeline section */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-auto">
          <GanttHeader
            weekGroups={weekGroups}
            onExpandHiddenGroup={expandHiddenGroup}
            onToggleWeekVisibility={toggleWeekVisibility}
          />

          <div className="flex-1 min-w-max">
            {outcomes.map((outcome) => {
              const opportunities = getAllOpportunitiesUnderOutcome(outcome.id)

              return (
                <div key={outcome.id} className="border-b-2 border-border">
                  <GanttGridRow
                    weekGroups={weekGroups}
                    className="bg-purple-50 dark:bg-purple-950/30 h-[41px] border-b"
                  />

                  {opportunities.map((opportunity) => {
                    const roadmapSolutions = getRoadmapSolutions(opportunity.id)

                    return (
                      <div key={opportunity.id}>
                        <GanttGridRow
                          weekGroups={weekGroups}
                          className="bg-amber-50/60 dark:bg-amber-950/20 h-[41px] border-b"
                        />

                        {roadmapSolutions.length === 0 && (
                          <GanttGridRow weekGroups={weekGroups} className="h-[41px] border-b" />
                        )}

                        {roadmapSolutions.map((solution) => {
                          const experiments = getNodeChildren(solution.id).filter(
                            (n) => n.type === "Experiment",
                          ) as ExperimentNode[]
                          const experimentsWithDates = experiments.filter(
                            (e) => e.dateRange?.start && e.status !== "backlog",
                          )
                          const isExpanded = expandedSolutions.has(solution.id)

                          const startWeekIndex = solution.startDate
                            ? findWeekIndex(weeks, new Date(solution.startDate))
                            : 0
                          const endWeekIndex = solution.endDate
                            ? findWeekIndex(weeks, new Date(solution.endDate))
                            : weeks.length - 1

                          const { left, width } = calculateBarPosition(weekGroups, startWeekIndex, endWeekIndex)

                          const getSolutionColor = (): "blue" | "green" | "purple" | "zinc" | "amber" | "red" | "teal" | "slate" => {
                            if (solution.status === "Done" && solution.releaseStatus) {
                              return solution.releaseStatus === "released" ? "green" : "red"
                            }
                            if (solution.status === "Now") return "blue"
                            if (solution.status === "Next") return "teal"
                            if (solution.status === "Later") return "amber"
                            if (solution.status === "Planned") return "purple"
                            if (solution.status === "Done") return "slate"
                            return "zinc"
                          }

                          return (
                            <div key={solution.id}>
                              <GanttGridRow weekGroups={weekGroups} className="hover:bg-muted/50">
                                {solution.startDate && (
                                  <GanttTimelineBar
                                    title={solution.title}
                                    left={left}
                                    width={width}
                                    color={getSolutionColor()}
                                    onClick={() => onItemClick(solution.id)}
                                  />
                                )}
                              </GanttGridRow>

                              {isExpanded &&
                                experimentsWithDates.map((experiment) => {
                                  const expStartWeekIndex = experiment.dateRange?.start
                                    ? findWeekIndex(weeks, new Date(experiment.dateRange.start))
                                    : 0
                                  const expEndWeekIndex = experiment.dateRange?.end
                                    ? findWeekIndex(weeks, new Date(experiment.dateRange.end))
                                    : weeks.length - 1

                                  const expPosition = calculateBarPosition(
                                    weekGroups,
                                    expStartWeekIndex,
                                    expEndWeekIndex,
                                  )

                                  const getExperimentColor = (): "blue" | "green" | "purple" | "zinc" | "amber" | "red" | "teal" | "slate" => {
                                    if (experiment.status === "completed" && experiment.decision) {
                                      if (experiment.decision === "ship") return "green"
                                      if (experiment.decision === "iterate") return "amber"
                                      if (experiment.decision === "kill") return "red"
                                    }
                                    if (experiment.status === "running") return "blue"
                                    if (experiment.status === "in-build") return "purple"
                                    return "zinc"
                                  }

                                  return (
                                    <GanttGridRow key={experiment.id} weekGroups={weekGroups} className="hover:bg-muted/50">
                                      <GanttTimelineBar
                                        title={experiment.title}
                                        left={expPosition.left}
                                        width={expPosition.width}
                                        color={getExperimentColor()}
                                        isExperiment={true}
                                        onClick={() => onItemClick(experiment.id)}
                                      />
                                    </GanttGridRow>
                                  )
                                })}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
