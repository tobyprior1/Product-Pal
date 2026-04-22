import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Save, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { interviewSchema } from "@/lib/validations"
import type { Interview } from "@/lib/pm-types"

interface InterviewUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    participantName?: string
    conductedAt?: string
    videoUrl?: string
    transcript: string
  }) => void
  editingInterview?: Interview | null
}

export function InterviewUploadDialog({
  open,
  onOpenChange,
  onSubmit,
  editingInterview,
}: InterviewUploadDialogProps) {
  const { toast } = useToast()
  const [participantName, setParticipantName] = useState("")
  const [conductedAt, setConductedAt] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [transcript, setTranscript] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editingInterview) {
      setParticipantName(editingInterview.participantName || "")
      setConductedAt(editingInterview.conductedAt || "")
      setVideoUrl(editingInterview.videoUrl || "")
      setTranscript(editingInterview.transcript)
    } else {
      setParticipantName("")
      setConductedAt("")
      setVideoUrl("")
      setTranscript("")
    }
    setErrors({})
  }, [editingInterview, open])

  const handleSubmit = () => {
    // Validate input data
    const result = interviewSchema.safeParse({
      participantName,
      conductedAt,
      videoUrl,
      transcript,
    })

    if (!result.success) {
      // Extract and display validation errors
      const newErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0].toString()] = issue.message
        }
      })
      setErrors(newErrors)
      
      toast({
        title: "Validation Error",
        description: result.error.issues[0].message,
        variant: "destructive",
      })
      return
    }

    // Clear errors and submit validated data
    setErrors({})
    onSubmit(result.data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingInterview ? "Edit Interview" : "Upload Interview"}
          </DialogTitle>
          <DialogDescription>
            {editingInterview
              ? "Update interview details and transcript"
              : "Add a customer interview transcript to your library"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="participantName">Participant Name</Label>
            <Input
              id="participantName"
              placeholder="e.g., Sarah Johnson, Customer #15"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className={errors.participantName ? "border-destructive" : ""}
            />
            {errors.participantName && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.participantName}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional: Helps identify and organize interviews (max 100 characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conductedAt">Interview Date</Label>
            <Input
              id="conductedAt"
              type="date"
              value={conductedAt}
              onChange={(e) => setConductedAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional: When was this interview conducted?
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video Recording URL</Label>
            <Input
              id="videoUrl"
              type="url"
              placeholder="https://..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className={errors.videoUrl ? "border-destructive" : ""}
            />
            {errors.videoUrl && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.videoUrl}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Optional: Link to Zoom, Loom, or other video recording (max 500 characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transcript">
              Transcript <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="transcript"
              placeholder="Paste the full interview transcript here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={16}
              className={`font-mono text-sm ${errors.transcript ? "border-destructive" : ""}`}
            />
            {errors.transcript && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.transcript}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Required: The full text of your interview (max 50,000 characters)
            </p>
            <p className="text-xs text-muted-foreground">
              Current length: {transcript.length.toLocaleString()} characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!transcript.trim()} className="gap-2">
            {editingInterview ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Interview
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
