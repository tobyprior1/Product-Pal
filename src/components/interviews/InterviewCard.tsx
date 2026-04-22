import { forwardRef } from "react"
import { Card } from "@/components/ui/card"
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { InterviewCardHeader } from "./InterviewCardHeader"
import { InterviewSnapshotSummary } from "./InterviewSnapshotSummary"
import { InterviewLoadingState } from "./InterviewLoadingState"
import { InterviewCardFooter } from "./InterviewCardFooter"
import type { Interview } from "@/lib/pm-types"

interface InterviewCardProps {
  interview: Interview
  snapshot?: {
    status: "pending" | "processing" | "completed" | "failed"
    error?: string
    participant_name?: string
    quick_facts?: string[]
    memorable_quote?: {
      quote: string
      evidence_ref: string
    }
    opportunities?: Array<{
      title: string
      description: string
      evidence_quote?: string
    }>
    insights?: Array<{
      statement: string
      evidence_quote?: string
      why_it_might_matter?: string
    }>
  }
  onEdit: (interview: Interview) => void
  onDelete: (interviewId: string) => void
  onCreateSnapshot: (interviewId: string) => void
  onViewTranscript: (interviewId: string) => void
}

export const InterviewCard = forwardRef<HTMLDivElement, InterviewCardProps>(
  ({ interview, snapshot, onEdit, onDelete, onCreateSnapshot, onViewTranscript }, ref) => {
    const hasSnapshot = !!snapshot
    const showSnapshotSummary = hasSnapshot && snapshot?.status === "completed"
    const isProcessing = hasSnapshot && snapshot?.status === "processing"

    return (
      <AccordionItem value={interview.id} className="border-0" ref={ref}>
        <Card className="overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]>div]:border-b">
            <InterviewCardHeader
              interview={interview}
              onEdit={() => onEdit(interview)}
              onDelete={() => onDelete(interview.id)}
            />
          </AccordionTrigger>

          <AccordionContent className="px-6 pb-6 pt-4">
            {isProcessing ? (
              <InterviewLoadingState />
            ) : showSnapshotSummary && snapshot ? (
              <InterviewSnapshotSummary snapshot={snapshot} />
            ) : (
              <div className="bg-muted rounded-md p-4">
                <p className="text-sm text-muted-foreground line-clamp-3 font-mono">{interview.transcript}</p>
              </div>
            )}

            <InterviewCardFooter
              interview={interview}
              snapshot={snapshot}
              onCreateSnapshot={() => onCreateSnapshot(interview.id)}
              onViewTranscript={() => onViewTranscript(interview.id)}
            />
          </AccordionContent>
        </Card>
      </AccordionItem>
    )
  },
)

InterviewCard.displayName = "InterviewCard"
