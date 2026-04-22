export const INTERVIEW_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  ANALYZED: "analyzed",
  APPLIED: "applied",
} as const

export const INTERVIEW_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  },
  processing: {
    label: "Processing",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  analyzed: {
    label: "Analyzed",
    color: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  applied: {
    label: "Applied",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
} as const

export const SNAPSHOT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const
