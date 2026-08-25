export type UUID = string

export type ExperimentDecision = "ship" | "kill" | "iterate" | null
export type ExperimentStatus = "backlog" | "planned" | "in-build" | "running" | "completed"
export type OpportunityStatus = "in-discovery" | "backlog" | "validated" | "invalidated"
export type SolutionStatus = "Now" | "Next" | "Later" | "Planned" | "Done" | "Backlog"
export type InterviewStatus = "pending" | "processing" | "analyzed" | "applied"

export interface Project {
  id: UUID
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  ownerId?: string
  /** Demo tree loaded client-side only; never persisted to the database */
  isSample?: boolean
}

export interface Tree {
  id: UUID
  name: string
  description?: string
  projectId?: UUID | null
  createdAt: string
  updatedAt: string
  ownerId?: string
  /** Demo tree loaded client-side only; never persisted to the database */
  isSample?: boolean
}

export interface BaseNode {
  id: UUID
  parentId: UUID | null
  type: "Outcome" | "Opportunity" | "Solution" | "Experiment"
  title: string
  notes?: string
  links?: string[]
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface OutcomeNode extends BaseNode {
  type: "Outcome"
  description?: string
  metric?: string
  baseline?: number
  current?: number
  target?: number
  timeframe?: string
  timeframePeriodType?: "quarter" | "half" | "year" | "custom"
  timeframePeriodValue?: string
  timeframeStartDate?: string
  timeframeEndDate?: string
  color?: string
}

export interface OpportunityNode extends BaseNode {
  type: "Opportunity"
  evidenceSummary?: string
  evidence?: Array<{ url: string; label?: string }>
  tags?: string[]
  status?: OpportunityStatus
  reach?: number
  confidence?: number
  impact?: number
}

export interface SolutionNode extends BaseNode {
  type: "Solution"
  description?: string
  status?: SolutionStatus
  releaseStatus?: "released" | "not-released"
  outcome?: string
  startDate?: string
  endDate?: string
}

export interface MetricImpact {
  metric: string
  before?: number
  after?: number
}

export interface ExperimentNode extends BaseNode {
  type: "Experiment"
  hypothesis: string
  method: string
  dateRange: { start: string; end?: string }
  resultSummary?: string
  decision?: ExperimentDecision
  confidence?: "low" | "medium" | "high" | number
  metricImpacts?: MetricImpact[]
  status: ExperimentStatus
}

export interface Interview {
  id: UUID
  treeId: UUID
  transcript: string
  participantName?: string
  conductedAt?: string
  videoUrl?: string
  uploadedAt: string
  status: InterviewStatus
  createdBy?: string
}

export interface InterviewOpportunity {
  id: UUID
  interviewId: UUID
  opportunityNodeId?: UUID
  title: string
  description: string
  whyItMatters: string
  evidenceQuote: string
  evidenceRef: string
  suggestedNextStep: string
  createdAt: string
  applied: boolean
}

export interface InterviewEvidence {
  id: UUID
  interviewId: UUID
  quote: string
  timestamp: string
  tags?: string[]
  linkedOpportunityIds?: UUID[]
}

export interface InterviewInsight {
  id: UUID
  interviewId: UUID
  statement: string
  evidence_quote: string
  evidence_ref: string
  why_it_might_matter: string
}

export interface InterviewSnapshot {
  id: UUID
  interviewId: UUID
  createdAt: string
  status: "pending" | "processing" | "completed" | "failed"
  participant_name: string
  quick_facts: string[]
  memorable_quote: {
    quote: string
    evidence_ref: string
  }
  opportunities: InterviewOpportunity[]
  insights: InterviewInsight[]
  data_quality: {
    coverage_notes: string
    confidence: "High" | "Medium" | "Low"
    leading_questions?: string[]
  }
  error?: string
}

export type OSTNode = OutcomeNode | OpportunityNode | SolutionNode | ExperimentNode

export interface TreeSnapshot {
  id: string
  label: string
  timestamp: number
  nodes: OSTNode[]
}

