import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tree, TreeSnapshot, OSTNode } from "../pm-types";
import { generateUUID, createTimestamp } from "../pm-utils";
import { useUIStore } from "../pm-ui-store";
import { getSeedData, getSeedInterviews } from "../pm-seed-data";
import type { DataSlice, TreesSlice } from "./types";
import {
  dbNodeToOSTNode,
  dbTreeToTree,
  dbProjectToProject,
  dbInterviewToInterview,
  dbSnapshotToSnapshot,
} from "./mappers";
import { showErrorToast, snapshotTimeLabel, deepCloneNodes } from "./shared";

export const createTreesSlice: DataSlice<TreesSlice> = (set, get) => ({
  setUserId: (userId) => set({ userId }),

  selectTree: async (treeId: string) => {
    useUIStore.getState().resetTreeViewState();
    set({ isLoading: true });

    try {
      const tree = get().trees.find((t) => t.id === treeId);
      if (!tree) {
        set({ isLoading: false });
        return;
      }

      const [nodesRes, snapshotsRes, interviewsRes] = await Promise.all([
        supabase.from("nodes").select("*").eq("tree_id", tree.id),
        supabase
          .from("snapshots")
          .select("*")
          .eq("tree_id", tree.id)
          .order("created_at", { ascending: true }),
        supabase.from("interviews").select("*").eq("tree_id", tree.id),
      ]);

      if (nodesRes.error) throw nodesRes.error;
      if (snapshotsRes.error) throw snapshotsRes.error;
      if (interviewsRes.error) throw interviewsRes.error;

      const snapshots: TreeSnapshot[] = (snapshotsRes.data || []).map(dbSnapshotToSnapshot);

      set({
        currentTree: tree,
        nodes: (nodesRes.data || []).map(dbNodeToOSTNode),
        snapshots,
        currentSnapshotIndex: snapshots.length - 1,
        snapshotCounter: snapshots.length,
        interviews: (interviewsRes.data || []).map(dbInterviewToInterview),
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading tree:", error);
      set({ isLoading: false });
    }
  },

  deleteTree: async (treeId: string) => {
    try {
      // Cascading deletes handle nodes, snapshots and interviews.
      const { error } = await supabase.from("trees").delete().eq("id", treeId);
      if (error) throw error;

      const trees = get().trees.filter((t) => t.id !== treeId);
      const currentTree = get().currentTree;

      set({
        trees,
        ...(currentTree?.id === treeId && {
          currentTree: null,
          nodes: [],
          snapshots: [],
          currentSnapshotIndex: -1,
          interviews: [],
        }),
      });

      toast({
        title: "Tree deleted",
        description: "Your tree has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting tree:", error);
      showErrorToast("Failed to delete tree. Please try again.");
    }
  },

  renameTree: async (treeId: string, newName: string) => {
    try {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from("trees")
        .update({ name: newName, updated_at: updatedAt })
        .eq("id", treeId);

      if (error) throw error;

      const trees = get().trees.map((t) => (t.id === treeId ? { ...t, name: newName, updatedAt } : t));
      const currentTree = get().currentTree;

      set({
        trees,
        ...(currentTree?.id === treeId && {
          currentTree: { ...currentTree, name: newName, updatedAt },
        }),
      });

      toast({
        title: "Tree renamed",
        description: "Your tree has been successfully renamed.",
      });
    } catch (error) {
      console.error("Error renaming tree:", error);
      showErrorToast("Failed to rename tree. Please try again.");
    }
  },

  loadUserData: async () => {
    const userId = get().userId;
    if (!userId) return;

    set({ isLoading: true });

    try {
      const [projectsRes, treesRes] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false }),
        supabase
          .from("trees")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false }),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (treesRes.error) throw treesRes.error;

      const projects = (projectsRes.data || []).map(dbProjectToProject);
      const trees = (treesRes.data || []).map(dbTreeToTree);

      // Keep the currently open tree (and its loaded nodes) intact so that
      // background auth refreshes never wipe the editor. Only re-point the
      // currentTree reference at the freshly fetched row.
      const openTree = get().currentTree;
      const refreshedCurrentTree = openTree
        ? openTree.isSample
          ? openTree
          : trees.find((t) => t.id === openTree.id) ?? null
        : null;

      set({
        projects,
        trees,
        currentTree: refreshedCurrentTree,
        ...(openTree && !refreshedCurrentTree
          ? {
              nodes: [],
              snapshots: [],
              currentSnapshotIndex: -1,
              snapshotCounter: 0,
              interviews: [],
            }
          : {}),
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      set({ isLoading: false });
    }
  },

  assignTreeToProject: async (treeId: string, projectId: string | null) => {
    try {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from("trees")
        .update({ project_id: projectId, updated_at: updatedAt })
        .eq("id", treeId);

      if (error) throw error;

      const trees = get().trees.map((t) => (t.id === treeId ? { ...t, projectId, updatedAt } : t));
      const currentTree = get().currentTree;

      set({
        trees,
        ...(currentTree?.id === treeId && {
          currentTree: { ...currentTree, projectId, updatedAt },
        }),
      });

      toast({
        title: projectId ? "Tree moved to project" : "Tree unassigned",
        description: projectId
          ? "Your tree has been moved to the selected project."
          : "Your tree is no longer assigned to a project.",
      });
    } catch (error) {
      console.error("Error assigning tree to project:", error);
      showErrorToast("Failed to move tree. Please try again.");
    }
  },

  setCurrentTree: async (tree) => {
    const userId = get().userId;
    if (!userId) return;
    if (tree.isSample) {
      set({ currentTree: tree });
      return;
    }

    const { error } = await supabase.from("trees").upsert({
      id: tree.id,
      user_id: userId,
      name: tree.name,
      description: tree.description,
      project_id: tree.projectId,
      created_at: tree.createdAt,
      updated_at: tree.updatedAt,
    });

    if (error) {
      console.error("Error saving tree:", error);
      return;
    }

    set({ currentTree: tree });
  },

  updateTreeMetadata: async () => {
    const tree = get().currentTree;
    if (!tree || tree.isSample) return;

    const updatedTree = { ...tree, updatedAt: createTimestamp() };

    const { error } = await supabase
      .from("trees")
      .update({ updated_at: updatedTree.updatedAt })
      .eq("id", tree.id);

    if (error) {
      console.error("Error updating tree metadata:", error);
      return;
    }

    set({ currentTree: updatedTree });
  },

  createNewTree: async (name = "New Tree", projectId: string | null = null) => {
    useUIStore.getState().resetTreeViewState();
    const userId = get().userId;
    if (!userId) throw new Error("User not authenticated");

    const newTree: Tree = {
      id: generateUUID(),
      name,
      projectId,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
      ownerId: userId,
    };

    const { error } = await supabase.from("trees").insert({
      id: newTree.id,
      user_id: userId,
      name: newTree.name,
      project_id: newTree.projectId,
      created_at: newTree.createdAt,
      updated_at: newTree.updatedAt,
    });

    if (error) {
      console.error("Error creating tree:", error);
      throw error;
    }

    set((state) => ({
      trees: [newTree, ...state.trees.filter((tree) => tree.id !== newTree.id)],
      currentTree: newTree,
      nodes: [],
      snapshots: [],
      currentSnapshotIndex: -1,
      snapshotCounter: 0,
    }));

    await get().createSnapshot("Empty tree");

    return newTree.id;
  },

  /** Client-side only demo tree: never persisted, never editable. */
  loadSampleTree: async () => {
    useUIStore.getState().resetTreeViewState();

    const newTree: Tree = {
      id: generateUUID(),
      name: "Sample Opportunity Tree (Demo)",
      description: "Example tree with sample data - not saved to your account",
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
      ownerId: undefined,
      isSample: true,
    };

    const seedNodes = getSeedData();
    const { interviews, opportunities } = getSeedInterviews(newTree.id);

    const doneSolutions = seedNodes
      .filter((node) => node.type === "Solution" && node.status === "Done")
      .map((node) => node.id);

    const backlogOpportunities = seedNodes
      .filter((node) => node.type === "Opportunity" && node.status === "backlog")
      .map((node) => node.id);

    useUIStore.getState().setCollapsedSolutions(new Set(doneSolutions));
    useUIStore.getState().setCollapsedOpportunities(new Set(backlogOpportunities));

    const interviewOpportunities: Record<string, any[]> = {};
    opportunities.forEach((opp) => {
      if (!interviewOpportunities[opp.interview_id]) {
        interviewOpportunities[opp.interview_id] = [];
      }
      interviewOpportunities[opp.interview_id].push({
        id: generateUUID(),
        interviewId: opp.interview_id,
        title: opp.title,
        description: opp.description,
        whyItMatters: opp.why_it_matters,
        evidenceQuote: opp.evidence_quote,
        evidenceRef: opp.evidence_ref,
        suggestedNextStep: opp.suggested_next_step,
        applied: opp.applied,
        createdAt: createTimestamp(),
      });
    });

    const snapshot: TreeSnapshot = {
      id: "snapshot-1",
      label: `Sample tree loaded – ${snapshotTimeLabel()}`,
      timestamp: Date.now(),
      nodes: deepCloneNodes(seedNodes as OSTNode[]),
    };

    set({
      currentTree: newTree,
      nodes: seedNodes,
      snapshots: [snapshot],
      currentSnapshotIndex: 0,
      snapshotCounter: 1,
      interviews,
      interviewOpportunities,
      isLoading: false,
    });
  },
});
