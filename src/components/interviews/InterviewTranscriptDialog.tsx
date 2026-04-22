import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText } from "lucide-react"
import type { Interview } from "@/lib/pm-types"

interface InterviewTranscriptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  interview: Interview | null
}

export function InterviewTranscriptDialog({
  open,
  onOpenChange,
  interview,
}: InterviewTranscriptDialogProps) {
  if (!interview) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Interview Transcript: {interview.participantName || "Unnamed Interview"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="pr-4">
            <div className="bg-muted/30 rounded-md p-6">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {interview.transcript}
              </pre>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
