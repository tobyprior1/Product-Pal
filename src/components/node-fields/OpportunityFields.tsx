import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { TextAreaField } from "./DraftFields"
import type { OpportunityNode } from "@/lib/pm-types"

interface OpportunityFieldsProps {
  node: OpportunityNode
  onUpdate: (updates: Partial<OpportunityNode>) => void
}

export function OpportunityFields({ node, onUpdate }: OpportunityFieldsProps) {
  return (
    <>
      <TextAreaField
        key={`${node.id}-evidenceSummary`}
        id="evidenceSummary"
        label="Evidence Summary"
        value={node.evidenceSummary}
        onCommit={(value) => onUpdate({ evidenceSummary: value })}
        rows={3}
        placeholder="Summarize the evidence for this opportunity..."
      />

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={node.status || "in-discovery"} onValueChange={(value) => onUpdate({ status: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in-discovery">In Discovery</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="validated">Validated</SelectItem>
            <SelectItem value="invalidated">Invalidated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Reach: {node.reach || 0}/10</Label>
        <Slider
          value={[node.reach || 0]}
          onValueChange={([value]) => onUpdate({ reach: value })}
          min={0}
          max={10}
          step={1}
        />
        <p className="text-xs text-muted-foreground">How many customers are impacted?</p>
      </div>

      <div className="space-y-2">
        <Label>Confidence: {node.confidence || 0}/10</Label>
        <Slider
          value={[node.confidence || 0]}
          onValueChange={([value]) => onUpdate({ confidence: value })}
          min={0}
          max={10}
          step={1}
        />
        <p className="text-xs text-muted-foreground">How confident are we it's a problem?</p>
      </div>

      <div className="space-y-2">
        <Label>Impact: {node.impact || 0}/10</Label>
        <Slider
          value={[node.impact || 0]}
          onValueChange={([value]) => onUpdate({ impact: value })}
          min={0}
          max={10}
          step={1}
        />
        <p className="text-xs text-muted-foreground">How impactful is solving it?</p>
      </div>
    </>
  )
}
