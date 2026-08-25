import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataStore } from "@/lib/pm-supabase-store";
import { useUIStore } from "@/lib/pm-ui-store";
import { generateUUID, createNodeMetadata } from "@/lib/pm-utils";
import type { OSTNode } from "@/lib/pm-types";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MoreVertical, Pencil, Trash2, Plus, FolderOpen } from "lucide-react";

const Project = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    projects,
    trees,
    selectTree,
    deleteTree,
    renameTree,
    assignTreeToProject,
    createNewTree,
    updateProject,
    deleteProject,
    loadUserData,
    userId,
  } = useDataStore();

  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const loading = pendingAction !== null;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [treeToRename, setTreeToRename] = useState<{ id: string; name: string } | null>(null);
  const [newTreeName, setNewTreeName] = useState("");
  const [projectDeleteOpen, setProjectDeleteOpen] = useState(false);
  const [projectRenameOpen, setProjectRenameOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  const projectTrees = useMemo(
    () => trees.filter((t) => t.projectId === id).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [trees, id]
  );

  useEffect(() => {
    if (!userId) return;
    if (projects.length === 0) {
      loadUserData();
    }
  }, [userId, projects.length, loadUserData]);

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || "");
    }
  }, [project]);

  if (!id) return <NotFound />;

  if (projects.length > 0 && !project) {
    return <NotFound />;
  }

  const handleSelectTree = async (treeId: string) => {
    setPendingAction(`tree:${treeId}`);
    try {
      await selectTree(treeId);
      navigate("/editor");
    } catch (error) {
      console.error("Error selecting tree:", error);
    } finally {
      setPendingAction(null);
    }
  };

  const handleNewTree = async () => {
    if (!userId) {
      navigate("/auth");
      return;
    }
    if (!id) return;

    setPendingAction("new-tree");
    try {
      await createNewTree("New Outcome", id);

      // Seed the tree with its root Outcome node and open it straight away
      const outcomeId = generateUUID();
      const outcomeSaved = await useDataStore.getState().addNode({
        id: outcomeId,
        parentId: null,
        type: "Outcome",
        title: "New Outcome",
        ...createNodeMetadata(),
      } as OSTNode);
      if (!outcomeSaved) {
        throw new Error("The root Outcome node could not be saved");
      }
      useUIStore.getState().setSelectedNodeId(outcomeId);

      navigate("/editor");
    } catch (error) {
      console.error("Error creating tree:", error);
      toast({
        title: "Outcome not created",
        description: "We couldn't save the new Outcome. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPendingAction(null);
    }
  };


  const handleLoadSample = async () => {
    setPendingAction("sample");
    try {
      await useDataStore.getState().loadSampleTree();
      navigate("/editor");
    } catch (error) {
      console.error("Error loading sample tree:", error);
    } finally {
      setPendingAction(null);
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

  const handleUnassignTree = async (treeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await assignTreeToProject(treeId, null);
  };

  const handleUpdateProject = async () => {
    if (!project || !projectName.trim()) return;
    await updateProject(project.id, {
      name: projectName.trim(),
      description: projectDescription.trim() || undefined,
    });
    setProjectRenameOpen(false);
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    await deleteProject(project.id);
    setProjectDeleteOpen(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col p-8 bg-background">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {project ? project.name : "Loading..."}
              </h1>
              {project?.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>
            {project && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setProjectRenameOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setProjectDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Outcomes</h2>
            {userId && (
              <Button onClick={handleNewTree} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                {pendingAction === "new-tree" ? "Creating..." : "New Outcome"}
              </Button>
            )}
          </div>

          {projectTrees.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <div className="space-y-3">
                <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground">No outcomes yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create a new outcome to start planning this project.
                </p>
                {userId && (
                  <Button onClick={handleNewTree} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    {pendingAction === "new-tree" ? "Creating..." : "Create Outcome"}
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projectTrees.map((tree) => (
                <Card
                  key={tree.id}
                  className="p-5 space-y-4 hover:border-primary/50 transition-all cursor-pointer hover:shadow-md group"
                  onClick={() => handleSelectTree(tree.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold text-foreground flex-1">
                        {tree.name}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleRenameClick(tree.id, tree.name, e as unknown as React.MouseEvent)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleUnassignTree(tree.id, e as unknown as React.MouseEvent)}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Move to Unassigned
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => handleDeleteClick(tree.id, e as unknown as React.MouseEvent)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                    {pendingAction === `tree:${tree.id}` ? "Loading..." : "Open Outcome"}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-border">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Quick Tips:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                Name your <strong className="text-foreground">Outcome</strong> — the goal you want to move
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
                <Button
                  variant="link"
                  onClick={handleLoadSample}
                  disabled={loading}
                  className="h-auto p-0 text-primary"
                >
                  Load a sample outcome to explore
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </div>


      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Outcome</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this outcome? This action cannot be undone.
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
            <DialogTitle>Rename Outcome</DialogTitle>
            <DialogDescription>Enter a new name for your outcome.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tree-name">Outcome Name</Label>
              <Input
                id="tree-name"
                value={newTreeName}
                onChange={(e) => setNewTreeName(e.target.value)}
                placeholder="Enter outcome name"
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

      <Dialog open={projectRenameOpen} onOpenChange={setProjectRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Input
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject} disabled={!projectName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={projectDeleteOpen} onOpenChange={setProjectDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? Its outcomes will become unassigned
              and will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-bold text-foreground">Project not found</h1>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  </div>
);

export default Project;
