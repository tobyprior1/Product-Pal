import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"
import { Button } from "@/components/ui/button"
import { X, Focus, Trash2, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { TextField } from "./node-fields/DraftFields"
import { OutcomeFields } from "./node-fields/OutcomeFields"
import { OpportunityFields, OpportunityPrioritisation } from "./node-fields/OpportunityFields"
import { PanelSection } from "./node-fields/PanelSection"
import { SolutionFields } from "./node-fields/SolutionFields"
import { ExperimentFields } from "./node-fields/ExperimentFields"
import { AddChildPanelButton } from "./AddChildPanelButton"
import { SolutionSuggestionsDialog } from "./SolutionSuggestionsDialog"
import { useState } from "react"

export function NodePanel() {
  const [suggestOpen, setSuggestOpen] = useState(false)

  const selectedNodeId = useUIStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useUIStore((state) => state.setSelectedNodeId)
  const focusedNodeId = useUIStore((state) => state.focusedNodeId)
  const setFocusedNodeId = useUIStore((state) => state.setFocusedNodeId)
  const isLocked = useUIStore((state) => state.isLocked)

  const nodes = useDataStore((state) => state.nodes)
  const updateNode = useDataStore((state) => state.updateNode)
  const deleteNode = useDataStore((state) => state.deleteNode)
  const canAddSubOpportunity = useDataStore((state) => state.canAddSubOpportunity(selectedNodeId ?? ""))
  const canAddSolution = useDataStore((state) => state.canAddSolution(selectedNodeId ?? ""))

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  if (!selectedNode) {
    return null
  }

  const childKind =
    selectedNode.type === "Outcome"
      ? ("opportunity" as const)
      : selectedNode.type === "Opportunity"
        ? ("solution" as const)
        : selectedNode.type === "Solution"
          ? ("experiment" as const)
          : null

  const dispatchAddChild = (childType?: "Opportunity") => {
    window.dispatchEvent(
      new CustomEvent("add-child-node", {
        detail: { parentId: selectedNode.id, parentType: selectedNode.type, childType },
      }),
    )
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
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="More actions">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={focusedNodeId === selectedNode.id ? handleDeactivateFocus : handleActivateFocus}
                >
                  <Focus className="w-4 h-4 mr-2" />
                  {focusedNodeId === selectedNode.id ? "Exit focus mode" : "Focus on this node"}
                </DropdownMenuItem>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete node
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
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
          <Button variant="ghost" size="icon" onClick={handleClose} title="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <PanelSection title="Details">
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
        </PanelSection>

        {selectedNode.type === "Opportunity" && (
          <PanelSection title="Prioritisation">
            <OpportunityPrioritisation
              node={selectedNode}
              onUpdate={(updates) => updateNode(selectedNode.id, updates)}
            />
          </PanelSection>
        )}

        {childKind && (
          <AddChildPanelButton
            childKind={childKind}
            onAddChild={() => dispatchAddChild()}
            disabled={isLocked}
            onAddSubOpportunity={
              selectedNode.type === "Opportunity" ? () => dispatchAddChild("Opportunity") : undefined
            }
            canAddSubOpportunity={selectedNode.type === "Opportunity" ? canAddSubOpportunity : true}
            canAddSolution={selectedNode.type === "Opportunity" ? canAddSolution : true}
            onSuggestSolutions={selectedNode.type === "Opportunity" ? () => setSuggestOpen(true) : undefined}
          />
        )}
      </div>

      {selectedNode.type === "Opportunity" && (
        <SolutionSuggestionsDialog
          open={suggestOpen}
          onOpenChange={setSuggestOpen}
          opportunityId={selectedNode.id}
          opportunityTitle={selectedNode.title}
        />
      )}
    </div>

  )
}
