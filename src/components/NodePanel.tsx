import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Focus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { OutcomeFields } from "./node-fields/OutcomeFields"
import { OpportunityFields } from "./node-fields/OpportunityFields"
import { SolutionFields } from "./node-fields/SolutionFields"
import { ExperimentFields } from "./node-fields/ExperimentFields"

export function NodePanel() {
  const selectedNodeId = useUIStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useUIStore((state) => state.setSelectedNodeId)
  const focusedNodeId = useUIStore((state) => state.focusedNodeId)
  const setFocusedNodeId = useUIStore((state) => state.setFocusedNodeId)

  const nodes = useDataStore((state) => state.nodes)
  const updateNode = useDataStore((state) => state.updateNode)
  const deleteNode = useDataStore((state) => state.deleteNode)

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  if (!selectedNode) {
    return null
  }

  const handleActivateFocus = () => {
    setFocusedNodeId(selectedNode.id)
  }

  const handleDeactivateFocus = () => {
    setFocusedNodeId(null)
  }

  const handleDelete = () => {
    deleteNode(selectedNode.id)
    setSelectedNodeId(null)
    setFocusedNodeId(null)
  }

  const handleClose = () => {
    setSelectedNodeId(null)
    setFocusedNodeId(null)
  }

  return (
    <div className="w-80 border-l border-border bg-card overflow-y-auto animate-slide-in-right">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{selectedNode.type}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={focusedNodeId === selectedNode.id ? "default" : "ghost"}
            size="icon"
            onClick={focusedNodeId === selectedNode.id ? handleDeactivateFocus : handleActivateFocus}
            title={focusedNodeId === selectedNode.id ? "Exit Focus Mode" : "Activate Focus Mode"}
          >
            <Focus className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this node?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{selectedNode.title}" and all its child nodes. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <TextField
          key={`${selectedNode.id}-title`}
          id="title"
          label="Title"
          value={selectedNode.title}
          onCommit={(value) => updateNode(selectedNode.id, { title: value })}
        />

        {selectedNode.type === "Outcome" && (
          <OutcomeFields node={selectedNode} onUpdate={(updates) => updateNode(selectedNode.id, updates)} />
        )}

        {selectedNode.type === "Opportunity" && (
          <OpportunityFields node={selectedNode} onUpdate={(updates) => updateNode(selectedNode.id, updates)} />
        )}

        {selectedNode.type === "Solution" && (
          <SolutionFields node={selectedNode} onUpdate={(updates) => updateNode(selectedNode.id, updates)} />
        )}

        {selectedNode.type === "Experiment" && (
          <ExperimentFields node={selectedNode} onUpdate={(updates) => updateNode(selectedNode.id, updates)} />
        )}
      </div>
    </div>
  )
}
