import { useEffect, useState } from "react"
import { Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PromptVariantsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PromptRow {
  id: string
  label: string
  system_prompt: string
  version: number
  is_active: boolean
  model: string | null
}

const MODEL_OPTIONS = [
  {
    value: "gemini-3.8-flash",
    name: "3.8 Flash",
    blurb: "Best quality. Newest model, but sometimes busy — falls back automatically.",
  },
  {
    value: "gemini-3.6-flash",
    name: "3.6 Flash",
    blurb: "Nearly as good, far more reliable right now. Safe everyday choice.",
  },
  {
    value: "gemini-3.5-flash-lite",
    name: "3.5 Flash-Lite",
    blurb: "Fastest and cheapest on your quota. Ideas are shorter and less nuanced.",
  },
] as const

export function PromptVariantsDialog({ open, onOpenChange }: PromptVariantsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<PromptRow[]>([])
  const [textA, setTextA] = useState("")
  const [textB, setTextB] = useState("")
  const [active, setActive] = useState<"A" | "B">("A")
  const [modelA, setModelA] = useState<string>("gemini-3.8-flash")
  const [modelB, setModelB] = useState<string>("gemini-3.8-flash")
  const [tally, setTally] = useState<{ a: number; b: number; tie: number }>({ a: 0, b: 0, tie: 0 })

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const [{ data: prompts }, { data: comparisons }] = await Promise.all([
        supabase
          .from("ai_prompts")
          .select("id,label,system_prompt,version,is_active,model")
          .eq("key", "suggest-solutions"),
        supabase.from("ai_prompt_comparisons").select("verdict").eq("key", "suggest-solutions"),
      ])
      if (cancelled) return

      const list = (prompts ?? []) as PromptRow[]
      setRows(list)
      setTextA(list.find((p) => p.label === "A")?.system_prompt ?? "")
      setTextB(list.find((p) => p.label === "B")?.system_prompt ?? "")
      setActive((list.find((p) => p.is_active)?.label as "A" | "B") ?? "A")
      setModelA(list.find((p) => p.label === "A")?.model ?? "gemini-3.8-flash")
      setModelB(list.find((p) => p.label === "B")?.model ?? "gemini-3.8-flash")

      const counts = { a: 0, b: 0, tie: 0 }
      for (const row of comparisons ?? []) {
        const verdict = (row as { verdict: string }).verdict
        if (verdict === "a") counts.a += 1
        else if (verdict === "b") counts.b += 1
        else counts.tie += 1
      }
      setTally(counts)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    const updates = [
      { label: "A" as const, text: textA, model: modelA },
      { label: "B" as const, text: textB, model: modelB },
    ]

    for (const { label, text, model } of updates) {
      const row = rows.find((p) => p.label === label)
      if (!row) continue
      const changed = row.system_prompt !== text
      await supabase
        .from("ai_prompts")
        .update({
          system_prompt: text,
          model,
          version: changed ? row.version + 1 : row.version,
          is_active: active === label,
        })
        .eq("id", row.id)
    }

    setSaving(false)
    toast({ title: "Prompts saved", description: `Variant ${active} is now the default.` })
    onOpenChange(false)
  }

  const empty = !loading && rows.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI prompt variants
          </DialogTitle>
          <DialogDescription>
            Two versions of the instructions the AI follows when suggesting solutions, each with
            its own model. Compare them side by side from any opportunity, then set the winner as
            the default. If the chosen model is busy, the app falls back to the others
            automatically.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {empty && (
          <p className="text-sm text-muted-foreground">
            Your prompts are created the first time you ask the AI for solution ideas. Generate
            suggestions once, then come back here to edit them.
          </p>
        )}

        {!loading && rows.length > 0 && (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <span className="font-medium">Results so far:</span> A won {tally.a}, B won {tally.b},{" "}
              {tally.tie} tie{tally.tie === 1 ? "" : "s"}
            </div>

            {(["A", "B"] as const).map((label) => (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`prompt-${label}`}>Variant {label}</Label>
                  <Button
                    type="button"
                    variant={active === label ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActive(label)}
                  >
                    {active === label ? "Default" : "Make default"}
                  </Button>
                </div>
                <Textarea
                  id={`prompt-${label}`}
                  value={label === "A" ? textA : textB}
                  onChange={(event) =>
                    label === "A" ? setTextA(event.target.value) : setTextB(event.target.value)
                  }
                  rows={10}
                  className={cn("font-mono text-xs leading-relaxed")}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={label === "A" ? modelA : modelB}
                    onValueChange={(value) =>
                      label === "A" ? setModelA(value) : setModelB(value)
                    }
                  >
                    <SelectTrigger className="w-[190px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground flex-1 min-w-[200px]">
                    {
                      MODEL_OPTIONS.find(
                        (option) => option.value === (label === "A" ? modelA : modelB),
                      )?.blurb
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Version {rows.find((p) => p.label === label)?.version ?? 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || rows.length === 0}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
