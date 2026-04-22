interface GanttTimelineBarProps {
  title: string
  left: number
  width: number
  color: "blue" | "green" | "purple" | "zinc" | "amber" | "red" | "teal" | "slate"
  isExperiment?: boolean
  onClick: () => void
}

export function GanttTimelineBar({ title, left, width, color, isExperiment = false, onClick }: GanttTimelineBarProps) {
  const colorClasses = {
    blue: "bg-blue-500/80 hover:bg-blue-500/90",
    green: "bg-green-500/80 hover:bg-green-500/90",
    purple: "bg-purple-500/80 hover:bg-purple-500/90",
    zinc: "bg-zinc-500/80 hover:bg-zinc-500/90",
    amber: "bg-amber-500/80 hover:bg-amber-500/90",
    red: "bg-red-500/80 hover:bg-red-500/90",
    teal: "bg-teal-500/80 hover:bg-teal-500/90",
    slate: "bg-slate-500/80 hover:bg-slate-500/90",
  }

  if (width <= 0) return null

  return (
    <div
      className={`absolute top-2 h-8 ${colorClasses[color]} rounded flex items-center px-2 text-xs text-white font-medium cursor-pointer transition-colors ${
        isExperiment ? "bg-stripe" : ""
      }`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        ...(isExperiment && {
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 8px,
            rgba(255, 255, 255, 0.15) 8px,
            rgba(255, 255, 255, 0.15) 16px
          )`,
        }),
      }}
      onClick={onClick}
    >
      <span className="truncate">{title}</span>
    </div>
  )
}
