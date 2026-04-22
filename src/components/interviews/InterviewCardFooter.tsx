import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, FileText } from "lucide-react"
import type { Interview } from "@/lib/pm-types"

interface InterviewCardFooterProps {
  interview: Interview
  snapshot?: {
    status: "pending" | "processing" | "completed" | "failed"
    error?: string
  }
  onCreateSnapshot: () => void
  onViewTranscript: () => void
}

export function InterviewCardFooter({
  interview,
  snapshot,
  onCreateSnapshot,
  onViewTranscript,
}: InterviewCardFooterProps) {
  const hasSnapshot = !!snapshot
  const isProcessing = hasSnapshot && snapshot?.status === "processing"

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-muted-foreground">{interview.transcript.length} characters</p>
      <div className="flex items-center gap-2">
        {!hasSnapshot && interview.status === "pending" && (
          <Button size="sm" variant="default" onClick={onCreateSnapshot} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Analyze Interview
          </Button>
        )}
        {isProcessing && (
          <Badge variant="outline" className="gap-1 bg-primary/5 border-primary/20">
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing...
          </Badge>
        )}
        {hasSnapshot && snapshot?.status === "pending" && (
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-4 h-4" />
            Analysis Pending
          </Badge>
        )}
        {hasSnapshot && snapshot?.status === "completed" && (
          <Button size="sm" variant="outline" className="gap-2 bg-transparent" onClick={onViewTranscript}>
            <FileText className="w-4 h-4" />
            View Transcript
          </Button>
        )}
        {hasSnapshot && snapshot?.status === "failed" && (
          <div className="flex flex-col items-end gap-1">
            <Badge variant="destructive" className="gap-1">
              Analysis Failed
            </Badge>
            {snapshot.error && <p className="text-xs text-destructive max-w-md text-right">{snapshot.error}</p>}
          </div>
        )}
        {interview.status === "analyzed" && !hasSnapshot && (
          <Button size="sm" variant="outline">
            Review Insights
          </Button>
        )}
      </div>
    </div>
  )
}
