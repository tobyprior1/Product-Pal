import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"

export function BusinessOutcomeDialog({ outcomeId, open, onOpenChange, kind = "BusinessOutcome" }: {
  outcomeId: string; open: boolean; onOpenChange: (open: boolean) => void; kind?: "BusinessOutcome" | "ProductNorthStar"
}) {
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const addBusinessOutcome = useDataStore(s => s.addBusinessOutcome)
  const addProductNorthStar = useDataStore(s => s.addProductNorthStar)
  const northStar = kind === "ProductNorthStar"
  const label = northStar ? "Product North Star" : "Business Outcome"
  const save = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      const id = await (northStar ? addProductNorthStar : addBusinessOutcome)(outcomeId, title.trim())
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
        <DialogHeader><DialogTitle>Add {label}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="business-outcome-title">{label}</Label>
          <Input id="business-outcome-title" autoFocus maxLength={500} value={title} onChange={e => setTitle(e.target.value)} placeholder={northStar ? "e.g., Become the daily workspace for independent teams" : "e.g., Increase annual recurring revenue"} onKeyDown={e => { if (e.key === "Enter") void save() }} />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving || !title.trim()} onClick={() => void save()}>{saving ? "Saving…" : `Add ${label}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}