import { useEffect, useState } from "react"
import { Sparkles, RefreshCw, AlertCircle, FlaskConical } from "lucide-react"
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
import { SuggestionProgress } from "@/components/SuggestionProgress"
import { supabase } from "@/integrations/supabase/client"
import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"
import { generateUUID, createNodeMetadata } from "@/lib/pm-utils"
import type { OSTNode } from "@/lib/pm-types"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export interface ExperimentSuggestion {
  title: string
  assumption: string
  hypothesis: string
  method: string
  successSignal?: string
}

interface ExperimentSuggestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  solutionId: string
  solutionTitle: string
}

export function ExperimentSuggestionsDialog({
  open,
  onOpenChange,
  solutionId,
  solutionTitle,
}: ExperimentSuggestionsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<ExperimentSuggestion[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [steer, setSteer] = useState("")

  const addNode = useDataStore((state) => state.addNode)
  const setSelectedNodeId = useUIStore((state) => state.setSelectedNodeId)

  const fetchSuggestions = async (mode: "replace" | "append" = "replace") => {
    if (mode === "append") setLoadingMore(true)
    else setLoading(true)
    setError(null)
    if (mode === "replace") {
      setSuggestions([])
      setSelected(new Set())
    }

    const { nodes, currentTree } = useDataStore.getState()
    const localSolution = nodes.find((n) => n.id === solutionId) as any
    const parent = localSolution?.parentId
      ? nodes.find((n) => n.id === localSolution.parentId)
      : undefined
    const outcomeTitle = nodes.find((n) => n.type === "Outcome")?.title
    const exclude = mode === "append" ? suggestions.map((s) => s.title) : []

    const { data, error: fnError } = await supabase.functions.invoke("suggest-experiments", {
      body: {
        solutionId,
        steer: steer.trim() || undefined,
        exclude,
        solution: {
          title: localSolution?.title ?? solutionTitle,
          data: localSolution ?? {},
          parentId: localSolution?.parentId,
          opportunityTitle: parent?.title,
          outcomeTitle,
          treeId: currentTree?.id,
        },
      },
    })

    if (fnError || (data as any)?.error) {
      setError((data as any)?.error ?? "Couldn't reach the AI right now. Please try again.")
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const incoming = ((data as any)?.suggestions ?? []) as ExperimentSuggestion[]
    if (mode === "append") {
      setSuggestions((prev) => {
        const seen = new Set(prev.map((s) => s.title.trim().toLowerCase()))
        return [...prev, ...incoming.filter((s) => !seen.has(s.title.trim().toLowerCase()))]
      })
    } else {
      setSuggestions(incoming)
    }
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => {
    if (open) {
      void fetchSuggestions()
    } else {
      setSuggestions([])
      setSelected(new Set())
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, solutionId])

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleAddSelected = async () => {
    const chosen = suggestions.filter((_, index) => selected.has(`exp-${index}`))
    if (chosen.length === 0) return

    setAdding(true)
    let lastId: string | null = null
    let added = 0

    for (const suggestion of chosen) {
      const node = {
        id: generateUUID(),
        parentId: solutionId,
        type: "Experiment",
        title: suggestion.title,
        hypothesis: [suggestion.hypothesis, suggestion.successSignal ? `Success signal: ${suggestion.successSignal}` : ""]
          .filter(Boolean)
          .join(" "),
        method: suggestion.method,
        dateRange: { start: new Date().toISOString().split("T")[0] },
        status: "planned",
        ...createNodeMetadata(),
      } as unknown as OSTNode

      const ok = await addNode(node)
      if (ok) {
        added += 1
        lastId = node.id
      }
    }

    setAdding(false)

    if (added > 0) {
      toast({
        title: `${added} experiment${added > 1 ? "s" : ""} added`,
        description: "Review the hypothesis and method in the side panel.",
      })
      if (lastId) setSelectedNodeId(lastId)
      onOpenChange(false)
    } else {
      setError("The experiments couldn't be saved. Please try again.")
    }
  }

  const renderCard = (suggestion: ExperimentSuggestion, key: string) => {
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
            <FlaskConical className="h-3.5 w-3.5 flex-shrink-0 text-teal-600" />
            <span className="text-sm font-medium">{suggestion.title}</span>
          </div>
          {suggestion.assumption && (
            <p className="text-xs text-muted-foreground">Assumption tested: {suggestion.assumption}</p>
          )}
          {suggestion.hypothesis && (
            <p className="text-xs italic text-muted-foreground/80">{suggestion.hypothesis}</p>
          )}
          {suggestion.method && <p className="text-xs text-muted-foreground">How: {suggestion.method}</p>}
          {suggestion.successSignal && (
            <p className="text-xs text-muted-foreground/70">Success signal: {suggestion.successSignal}</p>
          )}
        </div>
      </button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Experiment ideas
          </DialogTitle>
          <DialogDescription>
            Ways to test whether{" "}
            <span className="font-medium text-foreground">"{solutionTitle}"</span> is worth building — each one
            targets a risky assumption. Nothing is added until you choose.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="experiment-steer" className="text-xs text-muted-foreground">
            Optional steer for the AI
          </Label>
          <Input
            id="experiment-steer"
            value={steer}
            onChange={(event) => setSteer(event.target.value)}
            placeholder="e.g. we can't talk to customers this month, keep it to data we already have"
            disabled={loading || adding}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                void fetchSuggestions()
              }
            }}
          />
        </div>

        {!loading && error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
          {loading && <SuggestionProgress label="Designing experiments" />}
          {!loading && suggestions.map((suggestion, index) => renderCard(suggestion, `exp-${index}`))}
          {loadingMore && <SuggestionProgress label="Designing 3 more experiments" />}
          {!loading && suggestions.length > 0 && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fetchSuggestions("append")}
              disabled={loadingMore || adding}
            >
              <Sparkles className={cn("h-3.5 w-3.5", loadingMore && "animate-pulse")} />
              {loadingMore ? "Generating more..." : "Generate 3 more experiments"}
            </Button>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => fetchSuggestions()}
            disabled={loading || loadingMore || adding}
            className="gap-2"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Start again
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adding}>
              Cancel
            </Button>
            <Button onClick={handleAddSelected} disabled={selected.size === 0 || adding}>
              {adding ? "Adding..." : `Add selected${selected.size > 0 ? ` (${selected.size})` : ""}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
