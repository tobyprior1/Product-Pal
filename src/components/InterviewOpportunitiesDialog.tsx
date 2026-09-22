import { useEffect, useState } from "react"
import { Sparkles, AlertCircle, Lightbulb, Quote, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SuggestionProgress } from "@/components/SuggestionProgress"
import { supabase } from "@/integrations/supabase/client"
import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"
import { generateUUID, createNodeMetadata } from "@/lib/pm-utils"
import type { OSTNode } from "@/lib/pm-types"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export interface ExtractedOpportunity {
  title: string
  need: string
  quote: string
  whyItMatters: string
}

interface InterviewOpportunitiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  outcomeId: string
  outcomeTitle: string
}

export function InterviewOpportunitiesDialog({
  open,
  onOpenChange,
  outcomeId,
  outcomeTitle,
}: InterviewOpportunitiesDialogProps) {
  const [transcript, setTranscript] = useState("")
  const [participant, setParticipant] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [opportunities, setOpportunities] = useState<ExtractedOpportunity[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [rowIds, setRowIds] = useState<string[]>([])

  const addNode = useDataStore((state) => state.addNode)
  const setSelectedNodeId = useUIStore((state) => state.setSelectedNodeId)

  useEffect(() => {
    if (!open) {
      setTranscript("")
      setParticipant("")
      setOpportunities([])
      setSelected(new Set())
      setError(null)
      setLoading(false)
      setInterviewId(null)
      setRowIds([])
    }
  }, [open])

  // Save the transcript and the extracted opportunities into the interview library
  // so every extraction stays traceable back to the conversation it came from.
  const saveToLibrary = async (
    incoming: ExtractedOpportunity[],
    participantName: string,
    treeId?: string,
  ): Promise<{ interviewId: string | null; rowIds: string[] }> => {
    if (!treeId) return { interviewId: null, rowIds: [] }

    try {
      const { addInterview, addInterviewOpportunity } = useDataStore.getState()

      let id = interviewId
      if (!id) {
        id = generateUUID()
        await addInterview({
          id,
          treeId,
          transcript: transcript.trim(),
          participantName: participantName || undefined,
          uploadedAt: new Date().toISOString(),
          status: "completed",
        } as any)

        await supabase.from("interview_snapshots").insert({
          interview_id: id,
          status: "completed",
          participant_name: participantName || null,
          quick_facts: [],
        })
      }

      const ids: string[] = []
      for (const opportunity of incoming) {
        const rowId = generateUUID()
        ids.push(rowId)
        await addInterviewOpportunity(id, {
          id: rowId,
          interviewId: id,
          title: opportunity.title,
          description: opportunity.need ?? "",
          whyItMatters: opportunity.whyItMatters ?? "",
          evidenceQuote: opportunity.quote ?? "",
          evidenceRef: participantName || "Interview",
          suggestedNextStep: "",
          createdAt: new Date().toISOString(),
          applied: false,
        } as any)
      }

      return { interviewId: id, rowIds: ids }
    } catch (saveError) {
      console.error("Couldn't save the interview to the library:", saveError)
      return { interviewId, rowIds: [] }
    }
  }

  const analyse = async () => {
    setLoading(true)
    setError(null)

    const { currentTree } = useDataStore.getState()

    const { data, error: fnError } = await supabase.functions.invoke("extract-opportunities", {
      body: {
        transcript,
        participantName: participant.trim() || undefined,
        treeId: currentTree?.id,
        outcomeTitle,
        exclude: opportunities.map((o) => o.title),
      },
    })

    if (fnError || (data as any)?.error) {
      setError((data as any)?.error ?? "Couldn't reach the AI right now. Please try again.")
      setLoading(false)
      return
    }

    const incoming = ((data as any)?.opportunities ?? []) as ExtractedOpportunity[]
    const resolvedParticipant = participant.trim() || ((data as any)?.participantName ?? "")
    setOpportunities(incoming)
    setSelected(new Set(incoming.map((_, index) => `opp-${index}`)))
    if ((data as any)?.participantName && !participant.trim()) {
      setParticipant((data as any).participantName)
    }

    const saved = await saveToLibrary(incoming, resolvedParticipant, currentTree?.id)
    setInterviewId(saved.interviewId)
    setRowIds(saved.rowIds)

    setLoading(false)
  }

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }


  const handleAddSelected = async () => {
    const chosenIndexes = opportunities
      .map((_, index) => index)
      .filter((index) => selected.has(`opp-${index}`))
    if (chosenIndexes.length === 0) return

    setAdding(true)
    let lastId: string | null = null
    let added = 0

    for (const index of chosenIndexes) {
      const opportunity = opportunities[index]
      const attribution = participant.trim() ? ` — ${participant.trim()}` : ""
      const node = {
        id: generateUUID(),
        parentId: outcomeId,
        type: "Opportunity",
        title: opportunity.title,
        evidenceSummary: [
          opportunity.need,
          opportunity.quote ? `"${opportunity.quote}"${attribution}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
        notes: opportunity.whyItMatters ? `Why it matters: ${opportunity.whyItMatters}` : undefined,
        status: "in-discovery",
        ...createNodeMetadata(),
      } as unknown as OSTNode

      const ok = await addNode(node)
      if (ok) {
        added += 1
        lastId = node.id

        // Link the library record to the node it became, so the evidence trail holds.
        const rowId = rowIds[index]
        if (interviewId && rowId) {
          await useDataStore.getState().updateInterviewOpportunity(interviewId, rowId, {
            applied: true,
            opportunityNodeId: node.id,
          })
        }
      }
    }

    setAdding(false)

    if (added > 0) {
      toast({
        title: `${added} opportunit${added > 1 ? "ies" : "y"} added`,
        description: interviewId
          ? "The transcript is saved in your interview library, with each quote as evidence."
          : "The customer quote is saved as evidence on each one.",
      })
      if (lastId) setSelectedNodeId(lastId)

      onOpenChange(false)
    } else {
      setError("The opportunities couldn't be saved. Please try again.")
    }
  }

  const hasResults = opportunities.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Turn an interview into opportunities
          </DialogTitle>
          <DialogDescription>
            Paste what a customer said. The AI pulls out the unmet needs behind it and adds the ones you pick
            under “{outcomeTitle}”.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hasResults && !loading && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="interview-participant">Who did you speak to? (optional)</Label>
                <Input
                  id="interview-participant"
                  value={participant}
                  onChange={(e) => setParticipant(e.target.value)}
                  placeholder="e.g. Sam, freelance designer"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interview-transcript">Interview transcript or notes</Label>
                <Textarea
                  id="interview-transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste the conversation here — rough notes work too."
                  className="min-h-[220px]"
                />
                <p className="text-xs text-muted-foreground">
                  Quotes are kept word-for-word, so each opportunity carries its evidence.
                </p>
              </div>
            </>
          )}

          {loading && <SuggestionProgress label="Reading the interview" />}

          {hasResults && !loading && (
            <div className="space-y-2">
              {opportunities.map((opportunity, index) => {
                const key = `opp-${index}`
                const isSelected = selected.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className={cn(
                      "flex w-full gap-3 rounded-lg border p-3 text-left transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Checkbox checked={isSelected} className="mt-0.5" tabIndex={-1} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                        <span className="text-sm font-medium">{opportunity.title}</span>
                      </div>
                      {opportunity.need && (
                        <p className="text-xs text-muted-foreground">{opportunity.need}</p>
                      )}
                      {opportunity.quote && (
                        <p className="flex gap-1.5 text-xs italic text-muted-foreground/80">
                          <Quote className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span>“{opportunity.quote}”</span>
                        </p>
                      )}
                      {opportunity.whyItMatters && (
                        <p className="text-xs text-muted-foreground/70">
                          Why it matters: {opportunity.whyItMatters}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {hasResults && !loading ? (
            <>
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => {
                  setOpportunities([])
                  setSelected(new Set())
                  setInterviewId(null)
                  setRowIds([])
                }}

              >
                <RefreshCw className="h-3.5 w-3.5" />
                Edit transcript
              </Button>
              <Button onClick={handleAddSelected} disabled={adding || selected.size === 0}>
                {adding ? "Adding…" : `Add ${selected.size} opportunit${selected.size === 1 ? "y" : "ies"}`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={analyse} disabled={loading || transcript.trim().length < 40} className="gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                {loading ? "Reading…" : "Find opportunities"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
