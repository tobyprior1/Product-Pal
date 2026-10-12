import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NumberField, TextAreaField, TextField } from "./DraftFields"
import { GuardrailFields } from "./GuardrailFields"
import type { OutcomeNode, BusinessOutcomeNode } from "@/lib/pm-types"

interface OutcomeFieldsProps {
  node: OutcomeNode | BusinessOutcomeNode
  onUpdate: (updates: Partial<OutcomeNode | BusinessOutcomeNode>) => void
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

      {node.type === "Outcome" && (
        <TextAreaField
          key={`${node.id}-businessContribution`}
          id="businessContribution"
          label="Contribution to business outcome"
          value={node.businessContribution}
          onCommit={(value) => onUpdate({ businessContribution: value })}
          placeholder="e.g., Faster onboarding increases activation, which supports subscription revenue."
          rows={3}
        />
      )}

      <TextField
        key={`${node.id}-metric`}
        id="metric"
        label="Metric"
        value={node.metric}
        onCommit={(value) => onUpdate({ metric: value })}
        placeholder="e.g., Customer Satisfaction Score"
      />

      <div className="space-y-1.5">
        <Label className="text-xs">Show values as</Label>
        <Select
          value={node.metricFormat ?? "number"}
          onValueChange={(v) => onUpdate({ metricFormat: v as "number" | "percentage" })}
        >
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
          </SelectContent>
        </Select>
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

      <TextField
        key={`${node.id}-timeframe`}
        id="timeframe"
        label="Timeframe"
        value={node.timeframePeriodValue}
        onCommit={(value) => onUpdate({ timeframePeriodValue: value })}
        placeholder="e.g., Q1 2027"
      />

      {node.type === "Outcome" && (
        <GuardrailFields
          nodeId={node.id}
          guardrails={node.guardrails}
          onChange={(guardrails) => onUpdate({ guardrails } as Partial<OutcomeNode>)}
        />
      )}
    </>
  )
}
