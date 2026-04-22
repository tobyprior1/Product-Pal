import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Lightbulb } from "lucide-react"

interface CreateOpportunityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    title: string
    description: string
    whyItMatters: string
    evidenceQuote: string
    suggestedNextStep: string
  }) => void
  interviewParticipant?: string
}

export function CreateOpportunityDialog({
  open,
  onOpenChange,
  onSubmit,
  interviewParticipant,
}: CreateOpportunityDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [whyItMatters, setWhyItMatters] = useState("")
  const [evidenceQuote, setEvidenceQuote] = useState("")
  const [suggestedNextStep, setSuggestedNextStep] = useState("")

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      whyItMatters,
      evidenceQuote,
      suggestedNextStep,
    })

    // Reset form
    setTitle("")
    setDescription("")
    setWhyItMatters("")
    setEvidenceQuote("")
    setSuggestedNextStep("")
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form when closing
    setTitle("")
    setDescription("")
    setWhyItMatters("")
    setEvidenceQuote("")
    setSuggestedNextStep("")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Create Opportunity from Interview
          </DialogTitle>
          <DialogDescription>
            Document an opportunity you discovered during the interview
            {interviewParticipant && ` with ${interviewParticipant}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Opportunity Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Users struggle to find account settings"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the opportunity in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whyItMatters">
              Why It Matters <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="whyItMatters"
              placeholder="Explain the impact and importance of addressing this opportunity..."
              value={whyItMatters}
              onChange={(e) => setWhyItMatters(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidenceQuote">
              Evidence Quote <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="evidenceQuote"
              placeholder="Copy the exact quote from the interview that supports this opportunity..."
              value={evidenceQuote}
              onChange={(e) => setEvidenceQuote(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Copy the exact words from the interview transcript
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestedNextStep">Suggested Next Step</Label>
            <Textarea
              id="suggestedNextStep"
              placeholder="What should we do to explore or validate this opportunity?"
              value={suggestedNextStep}
              onChange={(e) => setSuggestedNextStep(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || !whyItMatters.trim() || !evidenceQuote.trim()}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Opportunity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
