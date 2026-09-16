import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const STAGES = [
  { label: "Reading your team and product context", at: 0 },
  { label: "Reviewing the opportunity and what's already tried", at: 3 },
  { label: "Exploring different angles", at: 7 },
  { label: "Writing the ideas", at: 12 },
  { label: "Checking they're distinct and testable", at: 20 },
]

/** Estimated-progress indicator: the AI returns in one go, so we pace a
 *  realistic ~25s estimate and hold just short of complete until it lands. */
export function SuggestionProgress({ label = "Generating ideas" }: { label?: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 0.25), 250)
    return () => clearInterval(id)
  }, [])

  const percent = Math.min(94, Math.round((1 - Math.exp(-elapsed / 11)) * 100))
  const activeIndex = STAGES.reduce((acc, stage, i) => (elapsed >= stage.at ? i : acc), 0)

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          {label}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">{Math.floor(elapsed)}s</span>
      </div>

      <Progress value={percent} className="h-1.5" />

      <ul className="space-y-1.5">
        {STAGES.map((stage, index) => {
          const done = index < activeIndex
          const active = index === activeIndex
          return (
            <li
              key={stage.label}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                done && "text-muted-foreground",
                active && "text-foreground",
                !done && !active && "text-muted-foreground/50",
              )}
            >
              {done ? (
                <Check className="h-3 w-3 flex-shrink-0 text-primary" />
              ) : active ? (
                <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin text-primary" />
              ) : (
                <span className="h-3 w-3 flex-shrink-0 rounded-full border border-current opacity-40" />
              )}
              {stage.label}
            </li>
          )
        })}
      </ul>

      {elapsed > 30 && (
        <p className="text-xs text-muted-foreground">
          Taking longer than usual — the model is busy, we're still waiting on it.
        </p>
      )}
    </div>
  )
}
