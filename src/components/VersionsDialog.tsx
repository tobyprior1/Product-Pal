import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDataStore } from "@/lib/pm-supabase-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock } from "lucide-react"

interface VersionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VersionsDialog({ open, onOpenChange }: VersionsDialogProps) {
  const snapshots = useDataStore((state) => state.snapshots)
  const currentSnapshotIndex = useDataStore((state) => state.currentSnapshotIndex)
  const restoreSnapshot = useDataStore((state) => state.restoreSnapshot)

  const handleRestore = (snapshotId: string) => {
    restoreSnapshot(snapshotId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {snapshots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No version history available
              </p>
            ) : (
              snapshots.map((snapshot, index) => (
                <div
                  key={snapshot.id}
                  className={`p-3 rounded-md border ${
                    index === currentSnapshotIndex
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{snapshot.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {snapshot.nodes.length} nodes
                        </p>
                      </div>
                    </div>
                    {index !== currentSnapshotIndex && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(snapshot.id)}
                      >
                        Restore
                      </Button>
                    )}
                    {index === currentSnapshotIndex && (
                      <span className="text-xs text-primary font-medium">Current</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
