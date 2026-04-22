export function calculateWeeks(minDate: Date, maxDate: Date): Date[] {
  const weeks: Date[] = []
  const currentWeek = new Date(minDate)

  // Set to Monday (1 = Monday, 0 = Sunday)
  const dayOfWeek = currentWeek.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  currentWeek.setDate(currentWeek.getDate() + daysToMonday)

  while (currentWeek <= maxDate) {
    weeks.push(new Date(currentWeek))
    currentWeek.setDate(currentWeek.getDate() + 7)
  }

  return weeks
}

export function formatWeek(date: Date): string {
  const month = date.toLocaleDateString("en-US", { month: "short" })
  const day = date.getDate()
  return `W/C ${month} ${day}`
}

export function findWeekIndex(weeks: Date[], date: Date): number {
  return weeks.findIndex((week) => {
    const weekEnd = new Date(week)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return date >= week && date < weekEnd
  })
}

export type WeekGroup =
  | { type: "visible"; weekIndex: number; week: Date }
  | { type: "hidden"; startIndex: number; endIndex: number; count: number; weeks: Date[] }

export function groupWeeks(weeks: Date[], hiddenWeeks: Set<number>): WeekGroup[] {
  const groups: WeekGroup[] = []
  let i = 0

  while (i < weeks.length) {
    if (hiddenWeeks.has(i)) {
      // Start a hidden group
      const startIndex = i
      const hiddenWeeksInGroup: Date[] = []

      while (i < weeks.length && hiddenWeeks.has(i)) {
        hiddenWeeksInGroup.push(weeks[i])
        i++
      }

      groups.push({
        type: "hidden",
        startIndex,
        endIndex: i - 1,
        count: hiddenWeeksInGroup.length,
        weeks: hiddenWeeksInGroup,
      })
    } else {
      // Visible week
      groups.push({
        type: "visible",
        weekIndex: i,
        week: weeks[i],
      })
      i++
    }
  }

  return groups
}

export function calculateBarPosition(
  weekGroups: WeekGroup[],
  startWeekIndex: number,
  endWeekIndex: number,
): { left: number; width: number } {
  let leftPos = 0
  for (const group of weekGroups) {
    if (group.type === "hidden") {
      if (group.endIndex < startWeekIndex) {
        leftPos += 64 // width of grouped hidden column
      } else if (group.startIndex < startWeekIndex) {
        leftPos += 64
        break
      } else {
        break
      }
    } else {
      if (group.weekIndex < startWeekIndex) {
        leftPos += 96 // width of visible column
      } else {
        break
      }
    }
  }

  let width = 0
  for (const group of weekGroups) {
    if (group.type === "hidden") {
      if (group.startIndex <= endWeekIndex && group.endIndex >= startWeekIndex) {
        width += 64
      }
    } else {
      if (group.weekIndex >= startWeekIndex && group.weekIndex <= endWeekIndex) {
        width += 96
      }
    }
  }

  return { left: leftPos, width }
}
