import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDataStore } from "@/lib/pm-supabase-store";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Trash2, Pencil } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { createNewTree, trees, selectTree, deleteTree, renameTree, userId } = useDataStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [treeToRename, setTreeToRename] = useState<{ id: string; name: string } | null>(null);
  const [newTreeName, setNewTreeName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleNewTree = async () => {
    if (!userId) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      await createNewTree("My Opportunity Tree");
      navigate("/editor");
    } catch (error) {
      console.error("Error creating tree:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async () => {
    // Sample tree doesn't require authentication
    setLoading(true);
    try {
      await useDataStore.getState().loadSampleTree();
      navigate("/editor");
    } catch (error) {
      console.error("Error loading sample tree:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTree = async (treeId: string) => {
    setLoading(true);
    try {
      await selectTree(treeId);
      navigate("/editor");
    } catch (error) {
      console.error("Error selecting tree:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (treeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTreeToDelete(treeId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (treeToDelete) {
      await deleteTree(treeToDelete);
      setTreeToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleRenameClick = (treeId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTreeToRename({ id: treeId, name: currentName });
    setNewTreeName(currentName);
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = async () => {
    if (treeToRename && newTreeName.trim()) {
      await renameTree(treeToRename.id, newTreeName.trim());
      setTreeToRename(null);
      setNewTreeName("");
      setRenameDialogOpen(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col p-8 bg-background">
      <div className="flex justify-end mb-4 gap-2">
        {user ? (
          <>
            <span className="text-sm text-muted-foreground self-center">
              {user.email}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              Product Pal
            </h1>
            <p className="text-lg text-muted-foreground">
              Your product strategy sidekick — build and visualise opportunity solution trees
            </p>

          </div>

          <div className="space-y-6">
            {trees.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">Your Trees</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {trees.map((tree) => (
                    <Card 
                      key={tree.id} 
                      className="p-6 space-y-4 hover:border-primary/50 transition-all cursor-pointer hover:shadow-md group"
                      onClick={() => handleSelectTree(tree.id)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-semibold text-foreground flex-1">
                            {tree.name}
                          </h3>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => handleRenameClick(tree.id, tree.name, e)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDeleteClick(tree.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {tree.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {tree.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(tree.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTree(tree.id);
                        }} 
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? "Loading..." : "Open Tree"}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Card className="p-6 space-y-4 border-dashed hover:border-primary/50 transition-colors">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  {user ? "Create New Tree" : "Get Started"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user
                    ? "Begin with a blank canvas and create your tree from scratch."
                    : "Sign in to create and save your opportunity solution trees."}
                </p>
              </div>
              <Button onClick={handleNewTree} className="w-full" disabled={loading} size="lg">
                {loading ? "Creating..." : user ? "Create New Tree" : "Sign In to Start"}
              </Button>
            </Card>
          </div>

          <div className="pt-8 border-t border-border">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Quick Tips:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  Start with your desired <strong className="text-foreground">Outcome</strong>
                </li>
                <li>
                  Add <strong className="text-foreground">Opportunities</strong> that ladder into it
                </li>
                <li>
                  Create <strong className="text-foreground">Solutions</strong> for each opportunity
                </li>
                <li>
                  Design <strong className="text-foreground">Experiments</strong> to validate solutions
                </li>
                <li className="pt-2">
                  <Button variant="link" onClick={handleLoadSample} disabled={loading} className="h-auto p-0 text-primary">
                    Load a sample tree to explore
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tree</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tree? This action cannot be undone.
              All nodes, experiments, solutions, and associated data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Tree</DialogTitle>
            <DialogDescription>
              Enter a new name for your tree.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tree-name">Tree Name</Label>
              <Input
                id="tree-name"
                value={newTreeName}
                onChange={(e) => setNewTreeName(e.target.value)}
                placeholder="Enter tree name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTreeName.trim()) {
                    handleConfirmRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRename} disabled={!newTreeName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;