import { NumberField, TextAreaField, TextField } from "./DraftFields"
import type { OutcomeNode } from "@/lib/pm-types"

interface OutcomeFieldsProps {
  node: OutcomeNode
  onUpdate: (updates: Partial<OutcomeNode>) => void
}

type NumericKey = "baseline" | "current" | "target"

const numericFields: { key: NumericKey; label: string }[] = [
  { key: "baseline", label: "Baseline" },
  { key: "current", label: "Current" },
  { key: "target", label: "Target" },
]

export function OutcomeFields({ node, onUpdate }: OutcomeFieldsProps) {
  return (
    <>
      <TextAreaField
        key={`${node.id}-description`}
        id="description"
        label="Description"
        value={node.description}
        onCommit={(value) => onUpdate({ description: value })}
        rows={3}
      />

      <TextField
        key={`${node.id}-metric`}
        id="metric"
        label="Metric"
        value={node.metric}
        onCommit={(value) => onUpdate({ metric: value })}
        placeholder="e.g., Customer Satisfaction Score"
      />

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

      <TextField
        key={`${node.id}-timeframe`}
        id="timeframe"
        label="Timeframe"
        value={node.timeframePeriodValue}
        onCommit={(value) => onUpdate({ timeframePeriodValue: value })}
        placeholder="e.g., Q1 2024"
      />
    </>
  )
}
