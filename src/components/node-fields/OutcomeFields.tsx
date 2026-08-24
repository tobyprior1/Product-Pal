import { useEffect, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { OutcomeNode } from "@/lib/pm-types"

interface OutcomeFieldsProps {
  node: OutcomeNode
  onUpdate: (updates: Partial<OutcomeNode>) => void
}

type NumericKey = "baseline" | "current" | "target"

function formatNumber(value: number | undefined) {
  return value === undefined ? "" : String(value)
}

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
  const [draft, setDraft] = useState(() => formatNumber(value))
  const isEditing = useRef(false)

  useEffect(() => {
    if (!isEditing.current) setDraft(formatNumber(value))
  }, [value])

  const reset = () => {
    setDraft(formatNumber(value))
    isEditing.current = false
  }

  const commit = () => {
    isEditing.current = false
    const trimmed = draft.trim()

    if (trimmed === "") {
      setDraft("")
      if (value !== undefined) onCommit(undefined)
      return
    }

    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) {
      setDraft(formatNumber(value))
      return
    }

    setDraft(String(parsed))
    if (parsed !== value) onCommit(parsed)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={draft}
        onFocus={() => {
          isEditing.current = true
        }}
        onChange={(e) => {
          setDraft(e.target.value)
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") {
            reset()
            e.currentTarget.blur()
          }
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
            key={`${node.id}-${key}`}
            id={`${node.id}-${key}`}
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
