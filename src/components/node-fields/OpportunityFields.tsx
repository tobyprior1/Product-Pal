import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
    </>
  )
}

const scores = [
  { key: "reach", label: "Reach", hint: "How many customers are impacted?" },
  { key: "confidence", label: "Confidence", hint: "How confident are we it's a problem?" },
  { key: "impact", label: "Impact", hint: "How impactful is solving it?" },
] as const

/** Compact Reach / Confidence / Impact scoring block. */
export function OpportunityPrioritisation({ node, onUpdate }: OpportunityFieldsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-md border border-border p-3 space-y-3">
        {scores.map(({ key, label, hint }) => (
          <div key={key} className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-20 shrink-0 cursor-help text-xs font-medium text-muted-foreground">{label}</span>
              </TooltipTrigger>
              <TooltipContent side="left">{hint}</TooltipContent>
            </Tooltip>
            <Slider
              className="flex-1"
              value={[node[key] || 0]}
              onValueChange={([value]) => onUpdate({ [key]: value } as Partial<OpportunityNode>)}
              min={0}
              max={10}
              step={1}
            />
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-foreground">{node[key] || 0}</span>
          </div>
        ))}
      </div>
    </TooltipProvider>
  )
}
