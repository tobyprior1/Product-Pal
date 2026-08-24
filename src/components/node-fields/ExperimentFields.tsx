import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TextAreaField, TextField } from "./DraftFields"
import type { ExperimentNode } from "@/lib/pm-types"

interface ExperimentFieldsProps {
  node: ExperimentNode
  onUpdate: (updates: Partial<ExperimentNode>) => void
}

export function ExperimentFields({ node, onUpdate }: ExperimentFieldsProps) {
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

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={node.status} onValueChange={(value) => onUpdate({ status: value as any })}>
          <SelectTrigger>
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

      {node.status === "completed" && (
        <div className="space-y-2">
          <Label htmlFor="decision">Decision</Label>
          <Select
            value={node.decision || ""}
            onValueChange={(value) => onUpdate({ decision: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ship">Ship</SelectItem>
              <SelectItem value="iterate">Iterate</SelectItem>
              <SelectItem value="kill">Kill</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <TextField
        key={`${node.id}-startDate`}
        id="startDate"
        label="Start Date"
        type="date"
        value={node.dateRange.start}
        onCommit={(value) => onUpdate({ dateRange: { ...node.dateRange, start: value } })}
      />

      <TextField
        key={`${node.id}-endDate`}
        id="endDate"
        label="End Date"
        type="date"
        value={node.dateRange.end}
        onCommit={(value) => onUpdate({ dateRange: { ...node.dateRange, end: value } })}
      />

      {node.status === "completed" && (
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
