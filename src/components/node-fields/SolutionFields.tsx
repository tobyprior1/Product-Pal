import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TextAreaField, TextField } from "./DraftFields"
import type { SolutionNode } from "@/lib/pm-types"

interface SolutionFieldsProps {
  node: SolutionNode
  onUpdate: (updates: Partial<SolutionNode>) => void
}

const compactLabel = "text-xs font-medium text-muted-foreground"

export function SolutionFields({ node, onUpdate }: SolutionFieldsProps) {
  return (
    <>
      <TextAreaField
        key={`${node.id}-description`}
        id="description"
        label="Description"
        value={node.description}
        onCommit={(value) => onUpdate({ description: value })}
        rows={3}
        placeholder="Describe the solution..."
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="status" className={compactLabel}>
            Status
          </Label>
          <Select value={node.status || "Backlog"} onValueChange={(value) => onUpdate({ status: value as any })}>
            <SelectTrigger id="status" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Now">Now</SelectItem>
              <SelectItem value="Next">Next</SelectItem>
              <SelectItem value="Later">Later</SelectItem>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="Backlog">Backlog</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="releaseStatus" className={compactLabel}>
            Release
          </Label>
          <Select
            value={node.releaseStatus || "not-released"}
            onValueChange={(value) => onUpdate({ releaseStatus: value as any })}
          >
            <SelectTrigger id="releaseStatus" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="not-released">Not Released</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TextField
          key={`${node.id}-startDate`}
          id="startDate"
          label="Start"
          type="date"
          value={node.startDate}
          onCommit={(value) => onUpdate({ startDate: value })}
          labelClassName={compactLabel}
          className="space-y-1.5"
        />

        <TextField
          key={`${node.id}-endDate`}
          id="endDate"
          label="End"
          type="date"
          value={node.endDate}
          onCommit={(value) => onUpdate({ endDate: value })}
          labelClassName={compactLabel}
          className="space-y-1.5"
        />
      </div>
    </>
  )
}
