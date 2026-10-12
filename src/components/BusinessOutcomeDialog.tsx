import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"

export function BusinessOutcomeDialog({ outcomeId, open, onOpenChange }: {
  outcomeId: string; open: boolean; onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const addBusinessOutcome = useDataStore(s => s.addBusinessOutcome)
  const save = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      const id = await addBusinessOutcome(outcomeId, title.trim())
      if (id) {
        useUIStore.getState().setSelectedNodeId(id)
        setTitle("")
        onOpenChange(false)
      }
    } finally { setSaving(false) }
  }
  return (
    <Dialog open={open} onOpenChange={saving ? undefined : onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Business Outcome</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="business-outcome-title">Business outcome</Label>
          <Input id="business-outcome-title" autoFocus maxLength={500} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Increase annual recurring revenue" onKeyDown={e => { if (e.key === "Enter") void save() }} />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving || !title.trim()} onClick={() => void save()}>{saving ? "Saving…" : "Add Business Outcome"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}