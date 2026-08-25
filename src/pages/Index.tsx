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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataStore } from "@/lib/pm-supabase-store";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, Folder, MoreVertical, Pencil, Plus, Trash2, TreePine } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const {
    createNewTree,
    createProject,
    updateProject,
    deleteProject,
    trees,
    projects,
    selectTree,
    deleteTree,
    renameTree,
    assignTreeToProject,
    userId,
  } = useDataStore();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const [treeDeleteOpen, setTreeDeleteOpen] = useState(false);
  const [treeToDelete, setTreeToDelete] = useState<string | null>(null);
  const [treeRenameOpen, setTreeRenameOpen] = useState(false);
  const [treeToRename, setTreeToRename] = useState<{ id: string; name: string } | null>(null);
  const [treeRenameValue, setTreeRenameValue] = useState("");

  const [projectCreateOpen, setProjectCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<{ id: string; name: string; description?: string } | null>(null);

  const [projectDeleteOpen, setProjectDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const unassignedTrees = useMemo(
    () => trees.filter((t) => !t.projectId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [trees]
  );




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

  const handleDeleteTreeClick = (treeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTreeToDelete(treeId);
    setTreeDeleteOpen(true);
  };

  const handleConfirmTreeDelete = async () => {
    if (treeToDelete) {
      await deleteTree(treeToDelete);
      setTreeToDelete(null);
      setTreeDeleteOpen(false);
    }
  };

  const handleRenameTreeClick = (treeId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTreeToRename({ id: treeId, name: currentName });
    setTreeRenameValue(currentName);
    setTreeRenameOpen(true);
  };

  const handleConfirmTreeRename = async () => {
    if (treeToRename && treeRenameValue.trim()) {
      await renameTree(treeToRename.id, treeRenameValue.trim());
      setTreeToRename(null);
      setTreeRenameValue("");
      setTreeRenameOpen(false);
    }
  };

  const handleCreateProject = async () => {
    if (!userId || !projectName.trim()) return;
    try {
      await createProject(projectName.trim(), projectDescription.trim() || undefined);
      setProjectName("");
      setProjectDescription("");
      setProjectCreateOpen(false);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleEditProjectClick = (project: { id: string; name: string; description?: string }, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToEdit(project);
    setProjectName(project.name);
    setProjectDescription(project.description || "");
    setProjectEditOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!projectToEdit || !projectName.trim()) return;
    await updateProject(projectToEdit.id, {
      name: projectName.trim(),
      description: projectDescription.trim() || undefined,
    });
    setProjectToEdit(null);
    setProjectName("");
    setProjectDescription("");
    setProjectEditOpen(false);
  };

  const handleDeleteProjectClick = (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(projectId);
    setProjectDeleteOpen(true);
  };

  const handleConfirmProjectDelete = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete);
      setProjectToDelete(null);
      setProjectDeleteOpen(false);
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
            <span className="text-sm text-muted-foreground self-center">{user.email}</span>
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
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-foreground">Product Pal</h1>
            <p className="text-lg text-muted-foreground">
              Plan your product strategy, prioritise the right opportunities, and ship outcomes with confidence.
            </p>
          </div>

          {userId && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-foreground">Projects</h2>
                  <Button onClick={() => setProjectCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </div>

                {projects.length === 0 ? (
                  <Card className="p-6 border-dashed text-center">
                    <p className="text-muted-foreground">
                      No projects yet. Create one to start organising your trees.
                    </p>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {projects.map((project) => (
                      <Card
                        key={project.id}
                        className="p-5 hover:border-primary/50 transition-all hover:shadow-md group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            to={`/projects/${project.id}`}
                            className="flex-1 min-w-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 p-2 rounded-lg">
                                <Folder className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-foreground truncate">
                                  {project.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {trees.filter((t) => t.projectId === project.id).length} trees
                                </p>
                              </div>
                            </div>
                            {project.description && (
                              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                {project.description}
                              </p>
                            )}
                          </Link>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={(e) => handleEditProjectClick(project, e)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDeleteProjectClick(project.id, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              asChild
                            >
                              <Link to={`/projects/${project.id}`}>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {unassignedTrees.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">Unassigned Trees</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {unassignedTrees.map((tree) => (
                      <Card
                        key={tree.id}
                        className="p-5 space-y-4 hover:border-primary/50 transition-all cursor-pointer hover:shadow-md group"
                        onClick={() => handleSelectTree(tree.id)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="bg-muted p-2 rounded-lg">
                                <TreePine className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <h3 className="text-lg font-semibold text-foreground truncate flex-1">
                                {tree.name}
                              </h3>
                            </div>
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
                                  onClick={(e) => handleRenameTreeClick(tree.id, tree.name, e as unknown as React.MouseEvent)}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                {projects.length > 0 && (
                                  <>
                                    {projects.map((project) => (
                                      <DropdownMenuItem
                                        key={project.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          assignTreeToProject(tree.id, project.id);
                                        }}
                                      >
                                        <Folder className="h-4 w-4 mr-2" />
                                        Move to {project.name}
                                      </DropdownMenuItem>
                                    ))}
                                  </>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => handleDeleteTreeClick(tree.id, e as unknown as React.MouseEvent)}
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
                          {loading ? "Loading..." : "Open Tree"}
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!user && (
            <Card className="p-6 space-y-4 border-dashed hover:border-primary/50 transition-colors">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-semibold text-foreground">Get Started</h2>
                <p className="text-sm text-muted-foreground">
                  Sign in to create projects and plan your product strategy.
                </p>
              </div>
              <Button onClick={() => navigate("/auth")} className="w-full" size="lg">
                Sign In to Start
              </Button>
            </Card>
          )}

        </div>
      </div>

      <AlertDialog open={treeDeleteOpen} onOpenChange={setTreeDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tree</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tree? This action cannot be undone. All nodes,
              experiments, solutions, and associated data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTreeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={treeRenameOpen} onOpenChange={setTreeRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Tree</DialogTitle>
            <DialogDescription>Enter a new name for your tree.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tree-name">Tree Name</Label>
              <Input
                id="tree-name"
                value={treeRenameValue}
                onChange={(e) => setTreeRenameValue(e.target.value)}
                placeholder="Enter tree name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && treeRenameValue.trim()) {
                    handleConfirmTreeRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTreeRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmTreeRename} disabled={!treeRenameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={projectCreateOpen} onOpenChange={setProjectCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Give your project a name and optional description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-project-name">Project Name</Label>
              <Input
                id="new-project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Q3 Growth"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-project-description">Description</Label>
              <Input
                id="new-project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!projectName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={projectEditOpen} onOpenChange={setProjectEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Project Name</Label>
              <Input
                id="edit-project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-description">Description</Label>
              <Input
                id="edit-project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectEditOpen(false)}>
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
              Are you sure you want to delete this project? Its trees will become unassigned and
              will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmProjectDelete}
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

export default Index;
