import { useEffect, useState } from "react"
import { Sparkles, RefreshCw, AlertCircle, Zap, Eye } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface VariantResult {
  promptId: string
  label: "A" | "B"
  version: number
  suggestions: SolutionSuggestion[]
}

interface SolutionSuggestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunityId: string
  opportunityTitle: string
}

type Mode = "single" | "compare"
type Side = "left" | "right"

export function SolutionSuggestionsDialog({
  open,
  onOpenChange,
  opportunityId,
  opportunityTitle,
}: SolutionSuggestionsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("single")
  const [suggestions, setSuggestions] = useState<SolutionSuggestion[]>([])
  const [sides, setSides] = useState<{ left: VariantResult; right: VariantResult } | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [verdict, setVerdict] = useState<Side | "tie" | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [steer, setSteer] = useState("")
  const [tally, setTally] = useState<{ a: number; b: number; tie: number } | null>(null)

  const addNode = useDataStore((state) => state.addNode)
  const setSelectedNodeId = useUIStore((state) => state.setSelectedNodeId)

  const loadTally = async () => {
    const { data } = await supabase
      .from("ai_prompt_comparisons")
      .select("verdict")
      .eq("key", "suggest-solutions")
    if (!data) return
    const counts = { a: 0, b: 0, tie: 0 }
    for (const row of data) {
      const value = (row as { verdict: string }).verdict
      if (value === "a") counts.a += 1
      else if (value === "b") counts.b += 1
      else counts.tie += 1
    }
    setTally(counts)
  }

  const fetchSuggestions = async (nextMode: Mode = mode) => {
    setLoading(true)
    setError(null)
    setSuggestions([])
    setSides(null)
    setSelected(new Set())
    setRevealed(false)
    setVerdict(null)

    const { nodes, currentTree } = useDataStore.getState()
    const localOpp = nodes.find((n) => n.id === opportunityId)
    const outcomeTitle = nodes.find((n) => n.type === "Outcome")?.title

    const { data, error: fnError } = await supabase.functions.invoke("suggest-solutions", {
      body: {
        opportunityId,
        compare: nextMode === "compare",
        steer: steer.trim() || undefined,
        opportunity: {
          title: localOpp?.title ?? opportunityTitle,
          data: (localOpp as any)?.data ?? {},
          outcomeTitle,
          treeId: currentTree?.id,
        },
      },
    })

    if (fnError || (data as any)?.error) {
      setError(
        (data as any)?.error ?? "Couldn't reach the AI right now. Please try again.",
      )
      setLoading(false)
      return
    }

    if (nextMode === "compare" && (data as any)?.compare) {
      const a = (data as any).a as VariantResult
      const b = (data as any).b as VariantResult
      // Blind test: randomise which variant appears on the left.
      const aFirst = Math.random() < 0.5
      setSides(aFirst ? { left: a, right: b } : { left: b, right: a })
    } else {
      setSuggestions(((data as any)?.suggestions ?? []) as SolutionSuggestion[])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) {
      void fetchSuggestions(mode)
      void loadTally()
    } else {
      setSuggestions([])
      setSides(null)
      setSelected(new Set())
      setError(null)
      setVerdict(null)
      setRevealed(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, opportunityId])

  const handleModeChange = (value: string) => {
    const nextMode = value as Mode
    setMode(nextMode)
    void fetchSuggestions(nextMode)
  }

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const chosenSuggestions = (): SolutionSuggestion[] => {
    if (mode === "single") {
      return suggestions.filter((_, index) => selected.has(`single-${index}`))
    }
    if (!sides) return []
    const picked: SolutionSuggestion[] = []
    ;(["left", "right"] as Side[]).forEach((side) => {
      sides[side].suggestions.forEach((suggestion, index) => {
        if (selected.has(`${side}-${index}`)) picked.push(suggestion)
      })
    })
    return picked
  }

  const recordVerdict = async (choice: Side | "tie") => {
    setVerdict(choice)
    setRevealed(true)
    if (!sides) return

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return

    const winnerLabel =
      choice === "tie" ? "tie" : sides[choice].label === "A" ? "a" : "b"
    const variantA = sides.left.label === "A" ? sides.left : sides.right
    const variantB = sides.left.label === "B" ? sides.left : sides.right
    const { currentTree } = useDataStore.getState()

    const { error: insertError } = await supabase.from("ai_prompt_comparisons").insert({
      user_id: userId,
      key: "suggest-solutions",
      opportunity_node_id: opportunityId,
      opportunity_title: opportunityTitle,
      tree_id: currentTree?.id ?? null,
      prompt_a_id: variantA.promptId,
      prompt_b_id: variantB.promptId,
      prompt_a_version: variantA.version,
      prompt_b_version: variantB.version,
      suggestions_a: variantA.suggestions as unknown as never,
      suggestions_b: variantB.suggestions as unknown as never,
      verdict: winnerLabel,
    })

    if (insertError) {
      toast({
        title: "Verdict not saved",
        description: "The comparison couldn't be recorded. Please try again.",
        variant: "destructive",
      })
      return
    }

    void loadTally()
  }

  const handleAddSelected = async () => {
    const chosen = chosenSuggestions()
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

  const skeletons = (count = 4) =>
    Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2 rounded-lg border border-border p-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    ))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(mode === "compare" ? "max-w-5xl" : "max-w-2xl")}>
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList>
              <TabsTrigger value="single" disabled={loading || adding}>
                Single
              </TabsTrigger>
              <TabsTrigger value="compare" disabled={loading || adding}>
                Compare A/B
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === "compare" && tally && (
            <p className="text-xs text-muted-foreground">
              A won {tally.a}, B won {tally.b}, {tally.tie} tie{tally.tie === 1 ? "" : "s"}
            </p>
          )}
        </div>

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

        {mode === "single" && (
          <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
            {loading && skeletons()}
            {!loading &&
              !error &&
              suggestions.map((suggestion, index) => renderCard(suggestion, `single-${index}`))}
          </div>
        )}

        {mode === "compare" && (
          <div className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              {(["left", "right"] as Side[]).map((side) => (
                <div key={side} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {side === "left" ? "Set 1" : "Set 2"}
                      {revealed && sides ? ` — Variant ${sides[side].label}` : ""}
                    </span>
                    {verdict &&
                      sides &&
                      ((verdict === side && (
                        <span className="text-xs font-medium text-primary">Your pick</span>
                      )) ||
                        (verdict === "tie" && side === "left" && (
                          <span className="text-xs text-muted-foreground">Tie</span>
                        )))}
                  </div>
                  <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-1">
                    {loading && skeletons(3)}
                    {!loading &&
                      !error &&
                      sides?.[side].suggestions.map((suggestion, index) =>
                        renderCard(suggestion, `${side}-${index}`),
                      )}
                  </div>
                </div>
              ))}
            </div>

            {!loading && !error && sides && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <span className="text-sm font-medium">Which set is better?</span>
                <Button
                  size="sm"
                  variant={verdict === "left" ? "default" : "outline"}
                  onClick={() => recordVerdict("left")}
                  disabled={verdict !== null}
                >
                  Set 1
                </Button>
                <Button
                  size="sm"
                  variant={verdict === "right" ? "default" : "outline"}
                  onClick={() => recordVerdict("right")}
                  disabled={verdict !== null}
                >
                  Set 2
                </Button>
                <Button
                  size="sm"
                  variant={verdict === "tie" ? "default" : "outline"}
                  onClick={() => recordVerdict("tie")}
                  disabled={verdict !== null}
                >
                  Too close to call
                </Button>
                {!revealed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                    onClick={() => setRevealed(true)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Reveal
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => fetchSuggestions()}
            disabled={loading || adding}
            className="gap-2"
          >
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
