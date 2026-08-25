import { useEffect, useState } from "react";
import { useDataStore } from "@/lib/pm-supabase-store";
import { useNavigate } from "react-router-dom";
import { FlowEditor } from "@/components/FlowEditor";
import { Topbar } from "@/components/Topbar";
import { NodePanel } from "@/components/NodePanel";
import { NewNodeDialog } from "@/components/NewNodeDialog";

const Editor = () => {
  const currentTree = useDataStore((state) => state.currentTree);
  const userId = useDataStore((state) => state.userId);
  const navigate = useNavigate();
  const [newNodeDialogOpen, setNewNodeDialogOpen] = useState(false);
  const [preselectedParentId, setPreselectedParentId] = useState<string>();
  const [preselectedNodeType, setPreselectedNodeType] = useState<"Outcome" | "Opportunity" | "Solution" | "Experiment">();

  useEffect(() => {
    // Redirect to auth if not logged in
    if (!userId) {
      navigate("/auth");
      return;
    }

    // No tree open (e.g. after a refresh) - go back to the dashboard instead of
    // silently creating an unassigned tree.
    if (!currentTree) {
      navigate("/");
    }
  }, [currentTree, userId, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setNewNodeDialogOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    const handleAddChildNode = (event: CustomEvent) => {
      const { parentId, parentType, childType } = event.detail
      setPreselectedParentId(parentId)
      
      // Determine the child node type based on parent type
      if (childType) {
        setPreselectedNodeType(childType)
      } else if (parentType === "Outcome") {
        setPreselectedNodeType("Opportunity")
      } else if (parentType === "Opportunity") {
        setPreselectedNodeType("Solution")
      } else if (parentType === "Solution") {
        setPreselectedNodeType("Experiment")
      }
      
      setNewNodeDialogOpen(true)
    }

    window.addEventListener("add-child-node", handleAddChildNode as EventListener)
    return () => window.removeEventListener("add-child-node", handleAddChildNode as EventListener)
  }, [])

  const handleTidy = () => {
    window.dispatchEvent(new Event("tidy-layout"))
  }

  const handleExportPNG = () => {
    window.dispatchEvent(new Event("export-png"))
  }

  const handleExportPDF = () => {
    window.dispatchEvent(new Event("export-pdf"))
  }

  const handleNewNode = () => {
    setNewNodeDialogOpen(true)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Topbar 
        onTidy={handleTidy}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onNewNode={handleNewNode}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <FlowEditor />
        </div>
        <NodePanel />
      </div>

      <NewNodeDialog 
        open={newNodeDialogOpen}
        onOpenChange={(open) => {
          setNewNodeDialogOpen(open)
          if (!open) {
            setPreselectedParentId(undefined)
            setPreselectedNodeType(undefined)
          }
        }}
        preselectedParentId={preselectedParentId}
        preselectedNodeType={preselectedNodeType}
      />
    </div>
  )
}

export default Editor
