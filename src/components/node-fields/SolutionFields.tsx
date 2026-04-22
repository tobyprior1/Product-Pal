import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SolutionNode } from "@/lib/pm-types"

interface SolutionFieldsProps {
  node: SolutionNode
  onUpdate: (updates: Partial<SolutionNode>) => void
}

export function SolutionFields({ node, onUpdate }: SolutionFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={node.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
          placeholder="Describe the solution..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={node.status || "Backlog"} onValueChange={(value) => onUpdate({ status: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Now">Now</SelectItem>
            <SelectItem value="Next">Next</SelectItem>
            <SelectItem value="Later">Later</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
            <SelectItem value="Backlog">Backlog</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="releaseStatus">Release Status</Label>
        <Select
          value={node.releaseStatus || "not-released"}
          onValueChange={(value) => onUpdate({ releaseStatus: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="not-released">Not Released</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          value={node.startDate || ""}
          onChange={(e) => onUpdate({ startDate: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="endDate">End Date</Label>
        <Input
          id="endDate"
          type="date"
          value={node.endDate || ""}
          onChange={(e) => onUpdate({ endDate: e.target.value })}
        />
      </div>
    </>
  )
}
