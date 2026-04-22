import type React from "react"
import type { WeekGroup } from "@/lib/pm-gantt-utils"

interface GanttGridRowProps {
  weekGroups: WeekGroup[]
  className?: string
  children?: React.ReactNode
}

export function GanttGridRow({ weekGroups, className = "", children }: GanttGridRowProps) {
  return (
    <div className={`relative h-12 border-b border-border ${className}`}>
      <div className="flex h-full">
        {weekGroups.map((group, groupIdx) => (
          <div
            key={groupIdx}
            className={`flex-shrink-0 ${group.type === "hidden" ? "w-16" : "w-24"} h-full border-r border-border`}
          />
        ))}
      </div>
      {children}
    </div>
  )
}
