import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { formatWeek, type WeekGroup } from "@/lib/pm-gantt-utils"

interface GanttHeaderProps {
  weekGroups: WeekGroup[]
  onExpandHiddenGroup: (startIndex: number, endIndex: number) => void
  onToggleWeekVisibility: (weekIndex: number) => void
}

export function GanttHeader({ weekGroups, onExpandHiddenGroup, onToggleWeekVisibility }: GanttHeaderProps) {
  return (
    <div className="flex border-b border-border bg-muted/30 sticky top-0 z-10 min-w-max">
      {weekGroups.map((group, groupIdx) => {
        if (group.type === "hidden") {
          return (
            <div
              key={`hidden-${groupIdx}`}
              className="flex-shrink-0 w-16 h-12 border-r border-border bg-muted/50 flex flex-col items-center justify-center gap-0.5"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onExpandHiddenGroup(group.startIndex, group.endIndex)}
                title={`Show ${group.count} hidden weeks`}
              >
                <Eye className="w-3 h-3" />
              </Button>
              <span className="text-[10px] text-muted-foreground">{group.count}w</span>
            </div>
          )
        }

        return (
          <div
            key={`visible-${groupIdx}`}
            className="flex-shrink-0 w-24 h-12 border-r border-border text-xs font-medium flex flex-col items-center justify-center group"
          >
            <div className="text-center">{formatWeek(group.week)}</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onToggleWeekVisibility(group.weekIndex)}
              title="Hide this week"
            >
              <EyeOff className="w-3 h-3" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
