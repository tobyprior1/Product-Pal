import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Project } from "../pm-types";
import { generateUUID, createTimestamp } from "../pm-utils";
import type { DataSlice, ProjectsSlice } from "./types";
import { dbProjectToProject } from "./mappers";
import { showErrorToast } from "./shared";

export const createProjectsSlice: DataSlice<ProjectsSlice> = (set, get) => ({
  loadProjects: async () => {
    const userId = get().userId;
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      set({ projects: (data || []).map(dbProjectToProject) });
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  },

  createProject: async (name: string, description?: string) => {
    const userId = get().userId;
    if (!userId) throw new Error("User not authenticated");

    const newProject: Project = {
      id: generateUUID(),
      name,
      description,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
      ownerId: userId,
    };

    const { error } = await supabase.from("projects").insert({
      id: newProject.id,
      user_id: userId,
      name: newProject.name,
      description: newProject.description,
      created_at: newProject.createdAt,
      updated_at: newProject.updatedAt,
    });

    if (error) {
      console.error("Error creating project:", error);
      throw error;
    }

    set({ projects: [...get().projects, newProject] });
    return newProject.id;
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
    const userId = get().userId;
    if (!userId) return;

    try {
      const updatedAt = new Date().toISOString();
      const dbUpdates: {
        updated_at: string;
        name?: string;
        description?: string;
        product_context?: string | null;
        target_users?: string | null;
        constraints?: string | null;
      } = { updated_at: updatedAt };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.productContext !== undefined) dbUpdates.product_context = updates.productContext ?? null;
      if (updates.targetUsers !== undefined) dbUpdates.target_users = updates.targetUsers ?? null;
      if (updates.constraints !== undefined) dbUpdates.constraints = updates.constraints ?? null;

      const { error } = await supabase.from("projects").update(dbUpdates).eq("id", id);
      if (error) throw error;

      set({
        projects: get().projects.map((p) => (p.id === id ? { ...p, ...updates, updatedAt } : p)),
      });

      toast({
        title: "Project updated",
        description: "Your project has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      showErrorToast("Failed to update project. Please try again.");
    }
  },

  deleteProject: async (id: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;

      const projects = get().projects.filter((p) => p.id !== id);
      const trees = get().trees.map((t) => (t.projectId === id ? { ...t, projectId: null } : t));
      const currentTree = get().currentTree;

      set({
        projects,
        trees,
        ...(currentTree?.projectId === id && {
          currentTree: { ...currentTree, projectId: null },
        }),
      });

      toast({
        title: "Project deleted",
        description: "Your project has been deleted. Its trees are now unassigned.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      showErrorToast("Failed to delete project. Please try again.");
    }
  },
});
