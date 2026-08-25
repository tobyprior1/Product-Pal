import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TextAreaField, TextField } from "./DraftFields"
import type { ExperimentNode } from "@/lib/pm-types"

interface ExperimentFieldsProps {
  node: ExperimentNode
  onUpdate: (updates: Partial<ExperimentNode>) => void
}

const compactLabel = "text-xs font-medium text-muted-foreground"

export function ExperimentFields({ node, onUpdate }: ExperimentFieldsProps) {
  const isCompleted = node.status === "completed"

  return (
    <>
      <TextAreaField
        key={`${node.id}-hypothesis`}
        id="hypothesis"
        label="Hypothesis"
        value={node.hypothesis}
        onCommit={(value) => onUpdate({ hypothesis: value })}
        rows={2}
        placeholder="We believe that..."
      />

      <TextAreaField
        key={`${node.id}-method`}
        id="method"
        label="Method"
        value={node.method}
        onCommit={(value) => onUpdate({ method: value })}
        rows={2}
        placeholder="How will you test this?"
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="status" className={compactLabel}>
            Status
          </Label>
          <Select value={node.status} onValueChange={(value) => onUpdate({ status: value as any })}>
            <SelectTrigger id="status" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in-build">In Build</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isCompleted && (
          <div className="space-y-1.5">
            <Label htmlFor="decision" className={compactLabel}>
              Decision
            </Label>
            <Select value={node.decision || ""} onValueChange={(value) => onUpdate({ decision: value as any })}>
              <SelectTrigger id="decision" className="h-9">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ship">Ship</SelectItem>
                <SelectItem value="iterate">Iterate</SelectItem>
                <SelectItem value="kill">Kill</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TextField
          key={`${node.id}-startDate`}
          id="startDate"
          label="Start"
          type="date"
          value={node.dateRange.start}
          onCommit={(value) => onUpdate({ dateRange: { ...node.dateRange, start: value } })}
          labelClassName={compactLabel}
          className="space-y-1.5"
        />

        <TextField
          key={`${node.id}-endDate`}
          id="endDate"
          label="End"
          type="date"
          value={node.dateRange.end}
          onCommit={(value) => onUpdate({ dateRange: { ...node.dateRange, end: value } })}
          labelClassName={compactLabel}
          className="space-y-1.5"
        />
      </div>

      {isCompleted && (
        <TextAreaField
          key={`${node.id}-resultSummary`}
          id="resultSummary"
          label="Result Summary"
          value={node.resultSummary}
          onCommit={(value) => onUpdate({ resultSummary: value })}
          rows={3}
          placeholder="What did you learn?"
        />
      )}
    </>
  )
}
