import type { SolutionNode, OSTNode } from "@/lib/pm-types"
import { Badge } from "@/components/ui/badge"
import { Lightbulb } from "lucide-react"

interface RoadmapSolutionCardProps {
  solution: SolutionNode
  opportunity: OSTNode
  outcome: OSTNode
  onClick: () => void
}

export function RoadmapSolutionCard({ solution, opportunity, onClick }: RoadmapSolutionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="space-y-3">
        <div>
          <h3 className="font-medium text-sm mb-1 text-foreground">{solution.title}</h3>
          {solution.description && <p className="text-xs text-muted-foreground line-clamp-2">{solution.description}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lightbulb className="w-3 h-3" />
            <span className="line-clamp-1">{opportunity.title}</span>
          </div>
        </div>

        {solution.releaseStatus && (
          <div>
            <Badge variant={solution.releaseStatus === "released" ? "default" : "secondary"} className="text-xs">
              {solution.releaseStatus === "released" ? "Released" : "Not Released"}
            </Badge>
          </div>
        )}
      </div>
    </button>
  )
}
