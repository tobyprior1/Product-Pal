import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ExperimentNode } from "@/lib/pm-types"

interface ExperimentFieldsProps {
  node: ExperimentNode
  onUpdate: (updates: Partial<ExperimentNode>) => void
}

export function ExperimentFields({ node, onUpdate }: ExperimentFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="hypothesis">Hypothesis</Label>
        <Textarea
          id="hypothesis"
          value={node.hypothesis || ""}
          onChange={(e) => onUpdate({ hypothesis: e.target.value })}
          rows={2}
          placeholder="We believe that..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">Method</Label>
        <Textarea
          id="method"
          value={node.method || ""}
          onChange={(e) => onUpdate({ method: e.target.value })}
          rows={2}
          placeholder="How will you test this?"
        />
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          value={node.dateRange.start || ""}
          onChange={(e) => onUpdate({ dateRange: { ...node.dateRange, start: e.target.value } })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">End Date</Label>
        <Input
          id="endDate"
          type="date"
          value={node.dateRange.end || ""}
          onChange={(e) => onUpdate({ dateRange: { ...node.dateRange, end: e.target.value } })}
        />
      </div>

      {node.status === "completed" && (
        <div className="space-y-2">
          <Label htmlFor="resultSummary">Result Summary</Label>
          <Textarea
            id="resultSummary"
            value={node.resultSummary || ""}
            onChange={(e) => onUpdate({ resultSummary: e.target.value })}
            rows={3}
            placeholder="What did you learn?"
          />
        </div>
      )}
    </>
  )
}
