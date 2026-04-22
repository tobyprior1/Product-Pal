import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { OutcomeNode } from "@/lib/pm-types"

interface OutcomeFieldsProps {
  node: OutcomeNode
  onUpdate: (updates: Partial<OutcomeNode>) => void
}

export function OutcomeFields({ node, onUpdate }: OutcomeFieldsProps) {
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
        <div className="space-y-2">
          <Label htmlFor="baseline">Baseline</Label>
          <Input
            id="baseline"
            type="number"
            value={node.baseline || ""}
            onChange={(e) => onUpdate({ baseline: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="current">Current</Label>
          <Input
            id="current"
            type="number"
            value={node.current || ""}
            onChange={(e) => onUpdate({ current: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target">Target</Label>
          <Input
            id="target"
            type="number"
            value={node.target || ""}
            onChange={(e) => onUpdate({ target: Number(e.target.value) })}
          />
        </div>
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
