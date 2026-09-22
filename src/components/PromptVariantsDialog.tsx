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
  const [row, setRow] = useState<PromptRow | null>(null)
  const [text, setText] = useState("")
  const [model, setModel] = useState<string>("gemini-3.8-flash")

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const { data: prompts } = await supabase
        .from("ai_prompts")
        .select("id,label,system_prompt,version,is_active,model")
        .eq("key", "suggest-solutions")
      if (cancelled) return

      const list = (prompts ?? []) as PromptRow[]
      const active = list.find((p) => p.is_active) ?? list[0] ?? null
      setRow(active)
      setText(active?.system_prompt ?? "")
      setModel(active?.model ?? "gemini-3.8-flash")
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open])

  const handleSave = async () => {
    if (!row) return
    setSaving(true)
    const changed = row.system_prompt !== text
    await supabase
      .from("ai_prompts")
      .update({
        system_prompt: text,
        model,
        version: changed ? row.version + 1 : row.version,
        is_active: true,
      })
      .eq("id", row.id)
    setSaving(false)
    toast({ title: "Prompt saved", description: "New ideas will follow these instructions." })
    onOpenChange(false)
  }

  const empty = !loading && !row

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI prompt
          </DialogTitle>
          <DialogDescription>
            The instructions the AI follows when suggesting solutions. If the chosen model is busy,
            the app falls back to the others automatically.
          </DialogDescription>
        </DialogHeader>

        {loading && <Skeleton className="h-48 w-full" />}

        {empty && (
          <p className="text-sm text-muted-foreground">
            Your prompt is created the first time you ask the AI for solution ideas. Generate
            suggestions once, then come back here to edit it.
          </p>
        )}

        {!loading && row && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="prompt-text">System prompt</Label>
              <Textarea
                id="prompt-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={12}
                className="font-mono text-xs leading-relaxed"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={model} onValueChange={setModel}>
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
                {MODEL_OPTIONS.find((option) => option.value === model)?.blurb}
              </p>
              <p className="text-xs text-muted-foreground">Version {row.version}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !row}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
