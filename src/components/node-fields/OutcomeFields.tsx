import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { OutcomeNode } from "@/lib/pm-types"

interface OutcomeFieldsProps {
  node: OutcomeNode
  onUpdate: (updates: Partial<OutcomeNode>) => void
}

type NumericKey = "baseline" | "current" | "target"

function NumberField({
  id,
  label,
  value,
  onCommit,
}: {
  id: string
  label: string
  value: number | undefined
  onCommit: (value: number | undefined) => void
}) {
  const [draft, setDraft] = useState(value === undefined || value === null ? "" : String(value))

  // Keep local draft in sync when the node value changes externally
  useEffect(() => {
    const external = value === undefined || value === null ? "" : String(value)
    if (draft !== "" && Number(draft) === value) return
    if (draft === external) return
    setDraft(external)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={draft}
        onChange={(e) => {
          const raw = e.target.value
          setDraft(raw)
          if (raw.trim() === "") {
            onCommit(undefined)
            return
          }
          const parsed = Number(raw)
          if (!Number.isNaN(parsed)) onCommit(parsed)
        }}
        onBlur={() => {
          if (draft.trim() === "") return
          const parsed = Number(draft)
          setDraft(Number.isNaN(parsed) ? "" : String(parsed))
        }}
      />
    </div>
  )
}

export function OutcomeFields({ node, onUpdate }: OutcomeFieldsProps) {
  const numericFields: { key: NumericKey; label: string }[] = [
    { key: "baseline", label: "Baseline" },
    { key: "current", label: "Current" },
    { key: "target", label: "Target" },
  ]

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={node.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="metric">Metric</Label>
        <Input
          id="metric"
          value={node.metric || ""}
          onChange={(e) => onUpdate({ metric: e.target.value })}
          placeholder="e.g., Customer Satisfaction Score"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {numericFields.map(({ key, label }) => (
          <NumberField
            key={key}
            id={key}
            label={label}
            value={node[key]}
            onCommit={(val) => onUpdate({ [key]: val } as Partial<OutcomeNode>)}
          />
        ))}
      </div>


      <div className="space-y-2">
        <Label htmlFor="timeframe">Timeframe</Label>
        <Input
          id="timeframe"
          value={node.timeframePeriodValue || ""}
          onChange={(e) => onUpdate({ timeframePeriodValue: e.target.value })}
          placeholder="e.g., Q1 2024"
        />
      </div>
    </>
  )
}
