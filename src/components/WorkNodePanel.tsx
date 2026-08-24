import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Network, Trash2 } from "lucide-react"
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
import { useNavigate } from "react-router-dom"
import { TextField } from "./node-fields/DraftFields"
import { OutcomeFields } from "./node-fields/OutcomeFields"
import { OpportunityFields } from "./node-fields/OpportunityFields"
import { SolutionFields } from "./node-fields/SolutionFields"
import { ExperimentFields } from "./node-fields/ExperimentFields"

interface WorkNodePanelProps {
  nodeId: string
  onClose: () => void
}

export function WorkNodePanel({ nodeId, onClose }: WorkNodePanelProps) {
  const navigate = useNavigate()
  const nodes = useDataStore((state) => state.nodes)
  const updateNode = useDataStore((state) => state.updateNode)
  const deleteNode = useDataStore((state) => state.deleteNode)
  const setFocusedNodeId = useUIStore((state) => state.setFocusedNodeId)

  const selectedNode = nodes.find((n) => n.id === nodeId)

  if (!selectedNode) {
    return null
  }

  const handleDelete = () => {
    deleteNode(selectedNode.id)
    setFocusedNodeId(null)
    onClose()
    navigate("/editor")
  }

  const handleViewInTree = () => {
    setFocusedNodeId(selectedNode.id)
    navigate("/editor")
  }

  return (
    <div className="w-96 border-l border-border bg-card overflow-y-auto flex flex-col h-full">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{selectedNode.type}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleViewInTree} title="View in Tree">
            <Network className="w-4 h-4" />
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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
