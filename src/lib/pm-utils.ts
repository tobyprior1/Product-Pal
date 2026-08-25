import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { OutcomeNode } from "./pm-types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusColor(type: string, status?: string): string {
  if (!status) return "bg-card"

  const statusMap: Record<string, string> = {
    "in-discovery": "bg-blue-100 dark:bg-blue-900/20",
    validated: "bg-green-100 dark:bg-green-900/20",
    invalidated: "bg-red-100 dark:bg-red-900/20",
    Now: "bg-purple-100 dark:bg-purple-900/20",
    Next: "bg-blue-100 dark:bg-blue-900/20",
    Later: "bg-gray-100 dark:bg-gray-900/20",
    Planned: "bg-violet-100 dark:bg-violet-900/20",
    Backlog: "bg-orange-100 dark:bg-orange-900/20",
    Done: "bg-green-100 dark:bg-green-900/20",
    planned: "bg-yellow-100 dark:bg-yellow-900/20",
    running: "bg-blue-100 dark:bg-blue-900/20",
  }

  return statusMap[status] || "bg-card"
}

export function getStatusBorderColor(type: string, status?: string): string {
  if (!status) return "border-border"

  const statusMap: Record<string, string> = {
    "in-discovery": "border-blue-300 dark:border-blue-700",
    validated: "border-green-300 dark:border-green-700",
    invalidated: "border-red-300 dark:border-red-700",
    Now: "border-purple-300 dark:border-purple-700",
    Next: "border-blue-300 dark:border-blue-700",
    Later: "border-gray-300 dark:border-gray-700",
    Backlog: "border-orange-300 dark:border-orange-700",
    Done: "border-green-300 dark:border-green-700",
    planned: "border-yellow-300 dark:border-yellow-700",
    running: "border-blue-300 dark:border-blue-700",
  }

  return statusMap[status] || "border-border"
}

export function getPriorityColor(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score >= 8) return "text-red-600"
  if (score >= 4) return "text-yellow-600"
  return "text-green-600"
}

export function getPriorityBadgeColor(score: number | null): string {
  if (score === null) return "bg-muted/50 text-muted-foreground border-muted"
  if (score >= 8) return "bg-red-500/10 text-red-600 border-red-500/20"
  if (score >= 4) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
  return "bg-green-500/10 text-green-600 border-green-500/20"
}

export function generatePeriodOptions() {
  const currentYear = new Date().getFullYear()
  const years = [currentYear, currentYear + 1, currentYear + 2]

  return {
    quarters: years.flatMap((year) => [`Q1 ${year}`, `Q2 ${year}`, `Q3 ${year}`, `Q4 ${year}`]),
    halves: years.flatMap((year) => [`H1 ${year}`, `H2 ${year}`]),
    years: years.map((year) => `${year}`),
  }
}

export function convertPeriodToDateRange(periodValue: string): { start: string; end: string } | null {
  if (!periodValue) return null

  const quarterMatch = periodValue.match(/^Q([1-4])\s+(\d{4})$/)
  if (quarterMatch) {
    const quarter = Number.parseInt(quarterMatch[1])
    const year = quarterMatch[2]
    const quarterStarts = ["01-01", "04-01", "07-01", "10-01"]
    const quarterEnds = ["03-31", "06-30", "09-30", "12-31"]
    return {
      start: `${year}-${quarterStarts[quarter - 1]}`,
      end: `${year}-${quarterEnds[quarter - 1]}`,
    }
  }

  const halfMatch = periodValue.match(/^H([1-2])\s+(\d{4})$/)
  if (halfMatch) {
    const half = Number.parseInt(halfMatch[1])
    const year = halfMatch[2]
    return half === 1
      ? { start: `${year}-01-01`, end: `${year}-06-30` }
      : { start: `${year}-07-01`, end: `${year}-12-31` }
  }

  const yearMatch = periodValue.match(/^(\d{4})$/)
  if (yearMatch) {
    const year = yearMatch[1]
    return { start: `${year}-01-01`, end: `${year}-12-31` }
  }

  return null
}

export function getTimeframeDateRange(outcome: {
  timeframePeriodType?: string
  timeframePeriodValue?: string
  timeframeStartDate?: string
  timeframeEndDate?: string
}): { start: string; end: string } | null {
  if (outcome.timeframePeriodType === "custom") {
    if (outcome.timeframeStartDate && outcome.timeframeEndDate) {
      return { start: outcome.timeframeStartDate, end: outcome.timeframeEndDate }
    }
    return null
  }

  if (outcome.timeframePeriodValue) {
    return convertPeriodToDateRange(outcome.timeframePeriodValue)
  }

  return null
}

export function formatTimeframeDisplay(outcome: OutcomeNode): string | null {
  if (outcome.timeframePeriodValue && !outcome.timeframePeriodType) {
    return outcome.timeframePeriodValue
  }

  if (outcome.timeframePeriodType) {
    if (outcome.timeframePeriodType === "custom") {
      if (outcome.timeframeStartDate && outcome.timeframeEndDate) {
        const start = new Date(outcome.timeframeStartDate)
        const end = new Date(outcome.timeframeEndDate)
        const formatDate = (date: Date) => {
          return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        }
        return `${formatDate(start)} - ${formatDate(end)}`
      }
      return null
    }

    return outcome.timeframePeriodValue || null
  }

  return null
}

export function createTimestamp(): string {
  return new Date().toISOString()
}

export function calculatePriorityScore(opportunity: {
  reach?: number
  confidence?: number
  impact?: number
}): number | null {
  const { reach, confidence, impact } = opportunity

  if (reach === undefined || confidence === undefined || impact === undefined) {
    return null
  }

  return Math.round((reach + confidence + impact) / 3)
}

export function getPriorityLabel(score: number | null): string {
  if (score === null) return "Not Assessed"
  if (score >= 8) return "High"
  if (score >= 4) return "Medium"
  return "Low"
}

export function generateUUID(): string {
  return crypto.randomUUID()
}

export function createNodeMetadata(userId?: string) {
  const now = createTimestamp()
  return {
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
  }
}

export function updateNodeMetadata(userId?: string) {
  return {
    updatedAt: createTimestamp(),
    updatedBy: userId,
  }
}
