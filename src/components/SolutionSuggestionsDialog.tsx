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
import { Skeleton } from "@/components/ui/skeleton"
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
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<SolutionSuggestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState(false)

  const addNode = useDataStore((state) => state.addNode)
  const setSelectedNodeId = useUIStore((state) => state.setSelectedNodeId)

  const fetchSuggestions = async () => {
    setLoading(true)
    setError(null)
    setSuggestions([])
    setSelected(new Set())

    const { nodes } = useDataStore.getState()
    const localOpp = nodes.find((n) => n.id === opportunityId)
    const outcomeTitle = nodes.find((n) => n.type === "Outcome")?.title

    const { data, error: fnError } = await supabase.functions.invoke("suggest-solutions", {
      body: {
        opportunityId,
        opportunity: {
          title: localOpp?.title ?? opportunityTitle,
          data: (localOpp as any)?.data ?? {},
          outcomeTitle,
        },
      },
    })


    if (fnError) {
      const message =
        (data as any)?.error ??
        "Couldn't reach the AI right now. Please try again."
      setError(message)
      setLoading(false)
      return
    }

    if ((data as any)?.error) {
      setError((data as any).error)
      setLoading(false)
      return
    }

    setSuggestions(((data as any)?.suggestions ?? []) as SolutionSuggestion[])
    setLoading(false)
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

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleAddSelected = async () => {
    const chosen = suggestions.filter((_, index) => selected.has(index))
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

        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {loading &&
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}

          {!loading && error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading &&
            !error &&
            suggestions.map((suggestion, index) => {
              const isSelected = selected.has(index)
              return (
                <button
                  key={`${suggestion.title}-${index}`}
                  type="button"
                  onClick={() => toggle(index)}
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
                  </div>
                </button>
              )
            })}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={fetchSuggestions} disabled={loading || adding} className="gap-2">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Regenerate
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
