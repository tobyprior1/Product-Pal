import { useEffect, useState } from "react"
import { Sparkles, RefreshCw, AlertCircle, Zap } from "lucide-react"
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

export interface SolutionSuggestion {
  title: string
  description: string
  rationale: string
  assumption?: string
}

interface SolutionSuggestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunityId: string
  opportunityTitle: string
}

export function SolutionSuggestionsDialog({
  open,
  onOpenChange,
  opportunityId,
  opportunityTitle,
}: SolutionSuggestionsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<SolutionSuggestion[]>([])
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
    const localOpp = nodes.find((n) => n.id === opportunityId)
    const outcomeTitle = nodes.find((n) => n.type === "Outcome")?.title
    const exclude = mode === "append" ? suggestions.map((s) => s.title) : []

    const { data, error: fnError } = await supabase.functions.invoke("suggest-solutions", {
      body: {
        opportunityId,
        steer: steer.trim() || undefined,
        exclude,
        opportunity: {
          title: localOpp?.title ?? opportunityTitle,
          data: (localOpp as any)?.data ?? {},
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

    const incoming = ((data as any)?.suggestions ?? []) as SolutionSuggestion[]
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
  }, [open, opportunityId])

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleAddSelected = async () => {
    const chosen = suggestions.filter((_, index) => selected.has(`single-${index}`))
    if (chosen.length === 0) return

    setAdding(true)
    let lastId: string | null = null
    let added = 0

    for (const suggestion of chosen) {
      const node = {
        id: generateUUID(),
        parentId: opportunityId,
        type: "Solution",
        title: suggestion.title,
        description: suggestion.description,
        status: "Backlog",
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
        title: `${added} solution${added > 1 ? "s" : ""} added`,
        description: "Review and refine them in the side panel.",
      })
      if (lastId) setSelectedNodeId(lastId)
      onOpenChange(false)
    } else {
      setError("The solutions couldn't be saved. Please try again.")
    }
  }

  const renderCard = (suggestion: SolutionSuggestion, key: string) => {
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
            <Zap className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
            <span className="text-sm font-medium">{suggestion.title}</span>
          </div>
          <p className="text-xs text-muted-foreground">{suggestion.description}</p>
          {suggestion.rationale && (
            <p className="text-xs italic text-muted-foreground/80">Why: {suggestion.rationale}</p>
          )}
          {suggestion.assumption && (
            <p className="text-xs text-muted-foreground/70">Riskiest assumption: {suggestion.assumption}</p>
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
            Solution ideas
          </DialogTitle>
          <DialogDescription>
            AI-generated inspiration for <span className="font-medium text-foreground">"{opportunityTitle}"</span>. Pick
            the ones worth exploring — nothing is added until you choose.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="suggestion-steer" className="text-xs text-muted-foreground">
            Optional steer for the AI
          </Label>
          <Input
            id="suggestion-steer"
            value={steer}
            onChange={(event) => setSteer(event.target.value)}
            placeholder="e.g. focus on low-effort ideas, we can't change pricing"
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
          {loading && <SuggestionProgress />}
          {!loading &&
            suggestions.map((suggestion, index) => renderCard(suggestion, `single-${index}`))}
          {loadingMore && <SuggestionProgress label="Generating 3 more ideas" />}
          {!loading && suggestions.length > 0 && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fetchSuggestions("append")}
              disabled={loadingMore || adding}
            >
              <Sparkles className={cn("h-3.5 w-3.5", loadingMore && "animate-pulse")} />
              {loadingMore ? "Generating more..." : "Generate 3 more ideas"}
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
