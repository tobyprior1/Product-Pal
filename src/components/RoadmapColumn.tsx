import type { SolutionNode, OSTNode } from "@/lib/pm-types"
import { RoadmapSolutionCard } from "./RoadmapSolutionCard"

interface RoadmapColumnProps {
  title: string
  items: Array<{ solution: SolutionNode; opportunity: OSTNode; outcome: OSTNode }>
  onItemClick: (nodeId: string) => void
  color: "blue" | "gray" | "slate"
}

const colorClasses = {
  blue: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  gray: "bg-gray-50 border-gray-200 dark:bg-gray-950/30 dark:border-gray-800",
  slate: "bg-slate-50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-800",
}

const headerColorClasses = {
  blue: "bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100",
  gray: "bg-gray-100 text-gray-900 dark:bg-gray-900/50 dark:text-gray-100",
  slate: "bg-slate-100 text-slate-900 dark:bg-slate-900/50 dark:text-slate-100",
}

export function RoadmapColumn({ title, items, onItemClick, color }: RoadmapColumnProps) {
  const groupedByOutcome = items.reduce(
    (acc, item) => {
      const outcomeId = item.outcome.id
      if (!acc[outcomeId]) {
        acc[outcomeId] = {
          outcome: item.outcome,
          items: [],
        }
      }
      acc[outcomeId].items.push(item)
      return acc
    },
    {} as Record<string, { outcome: OSTNode; items: typeof items }>,
  )

  const outcomeGroups = Object.values(groupedByOutcome)

  return (
    <div className="flex-1 min-w-0">
      <div className={`rounded-lg border ${colorClasses[color]} h-full flex flex-col`}>
        <div className={`px-4 py-3 rounded-t-lg ${headerColorClasses[color]}`}>
          <h2 className="font-bold text-sm">
            {title} <span className="font-normal">({items.length})</span>
          </h2>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-auto">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No solutions in this timeframe</p>
            </div>
          ) : (
            outcomeGroups.map(({ outcome, items: outcomeItems }) => (
              <div key={outcome.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{outcome.title}</h3>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-2">
                  {outcomeItems.map((item) => (
                    <RoadmapSolutionCard
                      key={item.solution.id}
                      solution={item.solution}
                      opportunity={item.opportunity}
                      outcome={item.outcome}
                      onClick={() => onItemClick(item.solution.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
