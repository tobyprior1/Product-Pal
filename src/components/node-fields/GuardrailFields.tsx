import { Plus, Trash2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NumberField, TextField } from "./DraftFields"
import { MAX_GUARDRAILS, isGuardrailBreached, type Guardrail } from "@/lib/pm-types"

interface Props {
  nodeId: string
  guardrails?: Guardrail[]
  onChange: (guardrails: Guardrail[]) => void
}

export function GuardrailFields({ nodeId, guardrails = [], onChange }: Props) {
  const update = (id: string, patch: Partial<Guardrail>) =>
    onChange(guardrails.map(g => (g.id === id ? { ...g, ...patch } : g)))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Guardrails (optional)
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={guardrails.length >= MAX_GUARDRAILS}
          onClick={() => onChange([...guardrails, { id: crypto.randomUUID(), metric: "", direction: "below" }])}
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Health metrics that must not get worse while you chase the target (up to {MAX_GUARDRAILS}).
      </p>
      {guardrails.map((g) => {
        const breached = isGuardrailBreached(g)
        return (
          <div
            key={g.id}
            className={`rounded-md border p-2 space-y-2 ${breached ? "border-destructive" : "border-border"}`}
          >
            <div className="flex items-end gap-2">
              <TextField
                key={`${nodeId}-${g.id}-metric`}
                id={`${g.id}-metric`}
                label="Health metric"
                value={g.metric}
                onCommit={(v) => update(g.id, { metric: v })}
                placeholder="e.g., Monthly churn %"
                className="flex-1 space-y-1.5"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove guardrail"
                onClick={() => onChange(guardrails.filter(x => x.id !== g.id))}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Keep</Label>
                <Select value={g.direction} onValueChange={(v) => update(g.id, { direction: v as Guardrail["direction"] })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="below">Below</SelectItem>
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="flat">Same (flat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <NumberField
                key={`${nodeId}-${g.id}-threshold`}
                id={`${g.id}-threshold`}
                label={g.direction === "flat" ? "Value" : "Limit"}
                value={g.threshold}
                onCommit={(v) => update(g.id, { threshold: v })}
              />
              <NumberField
                key={`${nodeId}-${g.id}-current`}
                id={`${g.id}-current`}
                label="Current"
                value={g.current}
                onCommit={(v) => update(g.id, { current: v })}
              />
            </div>
            {breached && <p className="text-xs font-medium text-destructive">Guardrail breached</p>}
          </div>
        )
      })}
    </div>
  )
}
