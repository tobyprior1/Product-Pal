import { create } from "zustand";
import type { OSTNode, TreeSnapshot, Tree, Interview, Project } from "./pm-types";
import { supabase } from "@/integrations/supabase/client";
import { generateUUID, createTimestamp, updateNodeMetadata } from "./pm-utils";
import { useUIStore } from "./pm-ui-store";
import { toast } from "@/hooks/use-toast";
import { getSeedData, getSeedInterviews } from "./pm-seed-data";

/** The demo tree is a read-only example and is never written to the database. */
const notifySampleReadOnly = () => {
  toast({
    title: "Sample tree is read-only",
    description: "Create a tree in a project to make and save your own changes.",
  });
};

interface DataStore {
  currentTree: Tree | null;
  trees: Tree[];
  projects: Project[];
  nodes: OSTNode[];
  snapshots: TreeSnapshot[];
  currentSnapshotIndex: number;
  snapshotCounter: number;
  interviews: Interview[];
  interviewOpportunities: Record<string, any[]>;
  isLoading: boolean;
  userId: string | null;

  setUserId: (userId: string | null) => void;
  loadUserData: () => Promise<void>;
  selectTree: (treeId: string) => Promise<void>;
  deleteTree: (treeId: string) => Promise<void>;
  renameTree: (treeId: string, newName: string) => Promise<void>;
  assignTreeToProject: (treeId: string, projectId: string | null) => Promise<void>;
  setCurrentTree: (tree: Tree) => Promise<void>;
  updateTreeMetadata: () => Promise<void>;
  setNodes: (nodes: OSTNode[]) => void;
  addNode: (node: OSTNode) => Promise<void>;
  updateNode: (id: string, updates: Partial<OSTNode>, userId?: string) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  createNewTree: (name?: string, projectId?: string | null) => Promise<string>;
  loadSampleTree: () => Promise<void>;
  createSnapshot: (label?: string) => Promise<void>;
  restoreSnapshot: (snapshotId: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getNodeChildren: (nodeId: string) => OSTNode[];
  getOpportunityStats: (opportunityId: string) => {
    solutionsCount: number;
    experimentsCount: number;
    solutionsInProgress: number;
    experimentsRunning: number;
  };
  isParentOpportunity: (opportunityId: string) => boolean;
  isSubOpportunity: (opportunityId: string) => boolean;
  canAddSubOpportunity: (opportunityId: string) => boolean;
  canAddSolution: (opportunityId: string) => boolean;
  getSubOpportunitiesCount: (opportunityId: string) => number;
  getBacklogItems: () => OSTNode[];
  getRoadmapItems: () => OSTNode[];
  getWorkItems: () => OSTNode[];
  getNodePath: (nodeId: string) => OSTNode[];
  isLeafOpportunity: (opportunityId: string) => boolean;
  getAllOpportunitiesUnderOutcome: (outcomeId: string) => OSTNode[];
  addInterview: (interview: Interview) => Promise<void>;
  updateInterview: (interviewId: string, updates: Partial<Interview>) => Promise<void>;
  deleteInterview: (interviewId: string) => Promise<void>;
  getInterviews: () => Interview[];
  addInterviewOpportunity: (interviewId: string, opportunity: any) => Promise<void>;
  updateInterviewOpportunity: (interviewId: string, opportunityId: string, updates: any) => Promise<void>;
  deleteInterviewOpportunity: (interviewId: string, opportunityId: string) => Promise<void>;
  getInterviewOpportunities: (interviewId: string) => any[];
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const MAX_SNAPSHOTS = 10;

// Helper to convert DB node to OSTNode
function dbNodeToOSTNode(dbNode: any): OSTNode {
  const base = {
    id: dbNode.id,
    parentId: dbNode.parent_id,
    type: dbNode.type,
    title: dbNode.title,
    notes: dbNode.notes,
    links: dbNode.links || [],
    createdAt: dbNode.created_at,
    updatedAt: dbNode.updated_at,
    createdBy: dbNode.created_by,
    updatedBy: dbNode.updated_by,
    ...dbNode.data,
  };
  return base as OSTNode;
}

// Helper to convert OSTNode to DB format
function ostNodeToDbNode(node: OSTNode, treeId: string) {
  const { id, parentId, type, title, notes, links, createdAt, updatedAt, createdBy, updatedBy, ...data } = node;
  return {
    id,
    tree_id: treeId,
    parent_id: parentId,
    type,
    title,
    notes,
    links,
    data,
    created_at: createdAt,
    updated_at: updatedAt,
    created_by: createdBy,
    updated_by: updatedBy,
  };
}

export const useDataStore = create<DataStore>((set, get) => ({
  currentTree: null,
  trees: [],
  projects: [],
  nodes: [],
  snapshots: [],
  currentSnapshotIndex: -1,
  snapshotCounter: 0,
  interviews: [],
  interviewOpportunities: {},
  isLoading: false,
  userId: null,

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

      // Load nodes for this tree
      const { data: nodesData, error: nodesError } = await supabase
        .from("nodes")
        .select("*")
        .eq("tree_id", tree.id);

      if (nodesError) throw nodesError;

      const nodes = (nodesData || []).map(dbNodeToOSTNode);

      // Load snapshots
      const { data: snapshotsData, error: snapshotsError } = await supabase
        .from("snapshots")
        .select("*")
        .eq("tree_id", tree.id)
        .order("created_at", { ascending: true });

      if (snapshotsError) throw snapshotsError;

      const snapshots: TreeSnapshot[] = (snapshotsData || []).map((s) => ({
        id: s.id,
        label: s.label,
        timestamp: new Date(s.created_at).getTime(),
        nodes: s.nodes_data as unknown as OSTNode[],
      }));

      // Load interviews
      const { data: interviewsData, error: interviewsError } = await supabase
        .from("interviews")
        .select("*")
        .eq("tree_id", tree.id);

      if (interviewsError) throw interviewsError;

      const interviews: Interview[] = (interviewsData || []).map((i) => ({
        id: i.id,
        treeId: i.tree_id,
        transcript: i.transcript,
        participantName: i.participant_name,
        conductedAt: i.conducted_at,
        videoUrl: i.video_url,
        uploadedAt: i.uploaded_at,
        status: i.status as any,
        createdBy: i.created_by,
      }));

      set({
        currentTree: tree,
        nodes,
        snapshots,
        currentSnapshotIndex: snapshots.length - 1,
        snapshotCounter: snapshots.length,
        interviews,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading tree:", error);
      set({ isLoading: false });
    }
  },

  deleteTree: async (treeId: string) => {
    try {
      // Delete the tree from Supabase (cascading deletes will handle nodes, snapshots, interviews)
      const { error } = await supabase
        .from("trees")
        .delete()
        .eq("id", treeId);

      if (error) throw error;

      // Update local state
      const trees = get().trees.filter((t) => t.id !== treeId);
      const currentTree = get().currentTree;
      
      set({ 
        trees,
        // Clear current tree if it was deleted
        ...(currentTree?.id === treeId && {
          currentTree: null,
          nodes: [],
          snapshots: [],
          currentSnapshotIndex: -1,
          interviews: [],
        })
      });

      toast({
        title: "Tree deleted",
        description: "Your tree has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting tree:", error);
      toast({
        title: "Error",
        description: "Failed to delete tree. Please try again.",
        variant: "destructive",
      });
    }
  },

  renameTree: async (treeId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from("trees")
        .update({ name: newName, updated_at: new Date().toISOString() })
        .eq("id", treeId);

      if (error) throw error;

      // Update local state
      const trees = get().trees.map((t) => 
        t.id === treeId ? { ...t, name: newName, updatedAt: new Date().toISOString() } : t
      );
      
      const currentTree = get().currentTree;
      
      set({ 
        trees,
        ...(currentTree?.id === treeId && {
          currentTree: { ...currentTree, name: newName, updatedAt: new Date().toISOString() }
        })
      });

      toast({
        title: "Tree renamed",
        description: "Your tree has been successfully renamed.",
      });
    } catch (error) {
      console.error("Error renaming tree:", error);
      toast({
        title: "Error",
        description: "Failed to rename tree. Please try again.",
        variant: "destructive",
      });
    }
  },

  loadUserData: async () => {
    const userId = get().userId;
    if (!userId) return;

    set({ isLoading: true });

    try {
      // Load all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (projectsError) throw projectsError;

      const projects: Project[] = (projectsData || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        ownerId: p.user_id,
      }));

      // Load all trees
      const { data: treesData, error: treesError } = await supabase
        .from("trees")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (treesError) throw treesError;

      const trees: Tree[] = (treesData || []).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        projectId: t.project_id,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        ownerId: t.user_id,
      }));

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

  loadProjects: async () => {
    const userId = get().userId;
    if (!userId) return;

    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (projectsError) throw projectsError;

      const projects: Project[] = (projectsData || []).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        ownerId: p.user_id,
      }));

      set({ projects });
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
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase.from("projects").update(dbUpdates).eq("id", id);

      if (error) throw error;

      const projects = get().projects.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      );

      set({ projects });

      toast({
        title: "Project updated",
        description: "Your project has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    }
  },

  deleteProject: async (id: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;

      const projects = get().projects.filter((p) => p.id !== id);
      const trees = get().trees.map((t) =>
        t.projectId === id ? { ...t, projectId: null } : t
      );
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
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  },

  assignTreeToProject: async (treeId: string, projectId: string | null) => {
    try {
      const { error } = await supabase
        .from("trees")
        .update({ project_id: projectId, updated_at: new Date().toISOString() })
        .eq("id", treeId);

      if (error) throw error;

      const trees = get().trees.map((t) =>
        t.id === treeId
          ? { ...t, projectId, updatedAt: new Date().toISOString() }
          : t
      );

      const currentTree = get().currentTree;

      set({
        trees,
        ...(currentTree?.id === treeId && {
          currentTree: { ...currentTree, projectId, updatedAt: new Date().toISOString() },
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
      toast({
        title: "Error",
        description: "Failed to move tree. Please try again.",
        variant: "destructive",
      });
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
    if (!tree) return;
    if (tree.isSample) return;

    const updatedTree = {
      ...tree,
      updatedAt: createTimestamp(),
    };

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

  setNodes: (nodes) => {
    const state = get();
    const counter = state.snapshotCounter + 1;
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const snapshot: TreeSnapshot = {
      id: `snapshot-${counter}`,
      label: `v${counter} – ${timeLabel}`,
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(nodes)),
    };

    const newSnapshots = state.snapshots.slice(0, state.currentSnapshotIndex + 1);
    newSnapshots.push(snapshot);
    const trimmedSnapshots = newSnapshots.slice(-MAX_SNAPSHOTS);

    set({
      nodes,
      snapshots: trimmedSnapshots,
      currentSnapshotIndex: trimmedSnapshots.length - 1,
      snapshotCounter: counter,
    });

    state.updateTreeMetadata();
  },

  addNode: async (node) => {
    const state = get();
    const tree = state.currentTree;
    if (!tree) return;
    if (tree.isSample) {
      notifySampleReadOnly();
      return;
    }

    const dbNode = ostNodeToDbNode(node, tree.id);

    const { error } = await supabase.from("nodes").insert([dbNode as any]);

    if (error) {
      console.error("Error adding node:", error);
      return;
    }

    state.setNodes([...state.nodes, node]);
  },

  updateNode: async (id, updates, userId) => {
    const state = get();
    const tree = state.currentTree;
    if (!tree) return;
    if (tree.isSample) {
      notifySampleReadOnly();
      return;
    }

    const metadata = updateNodeMetadata(userId);
    const updatedNode = state.nodes.find((n) => n.id === id);
    if (!updatedNode) return;

    const mergedNode = { ...updatedNode, ...updates, ...metadata };
    const dbNode = ostNodeToDbNode(mergedNode as OSTNode, tree.id);

    const { error } = await supabase.from("nodes").update(dbNode as any).eq("id", id);

    if (error) {
      console.error("Error updating node:", error);
      return;
    }

    const updatedNodes = state.nodes.map((node) => (node.id === id ? (mergedNode as OSTNode) : node));
    state.setNodes(updatedNodes);
  },

  deleteNode: async (id) => {
    const state = get();
    if (state.currentTree?.isSample) {
      notifySampleReadOnly();
      return;
    }
    const nodesToDelete = new Set<string>([id]);

    const findChildren = (parentId: string) => {
      state.nodes.forEach((node) => {
        if (node.parentId === parentId) {
          nodesToDelete.add(node.id);
          findChildren(node.id);
        }
      });
    };

    findChildren(id);

    // Delete from database
    const { error } = await supabase.from("nodes").delete().in("id", Array.from(nodesToDelete));

    if (error) {
      console.error("Error deleting nodes:", error);
      return;
    }

    const filteredNodes = state.nodes.filter((node) => !nodesToDelete.has(node.id));
    state.setNodes(filteredNodes);
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

    set({
      currentTree: newTree,
      nodes: [],
      snapshots: [],
      currentSnapshotIndex: -1,
      snapshotCounter: 0,
    });

    await get().createSnapshot("Empty tree");

    return newTree.id;
  },

  loadSampleTree: async () => {
    useUIStore.getState().resetTreeViewState();
    // Sample tree works entirely client-side - no database persistence
    const newTree: Tree = {
      id: generateUUID(),
      name: "Sample Opportunity Tree (Demo)",
      description: "Example tree with sample data - not saved to your account",
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
      ownerId: undefined, // No owner for demo tree
      isSample: true,
    };

    const seedNodes = getSeedData();
    
    // Load sample interview data
    const { interviews, opportunities } = getSeedInterviews(newTree.id);

    // Set initial collapsed state for sample tree
    const doneSolutions = seedNodes
      .filter((node) => node.type === "Solution" && node.status === "Done")
      .map((node) => node.id);

    const backlogOpportunities = seedNodes
      .filter((node) => node.type === "Opportunity" && node.status === "backlog")
      .map((node) => node.id);

    useUIStore.getState().setCollapsedSolutions(new Set(doneSolutions));
    useUIStore.getState().setCollapsedOpportunities(new Set(backlogOpportunities));

    // Load interview opportunities into the store
    const interviewOpportunitiesMap: Record<string, any[]> = {};
    opportunities.forEach(opp => {
      if (!interviewOpportunitiesMap[opp.interview_id]) {
        interviewOpportunitiesMap[opp.interview_id] = [];
      }
      interviewOpportunitiesMap[opp.interview_id].push({
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

    // Set everything in the client-side store only
    set({
      currentTree: newTree,
      nodes: seedNodes,
      snapshots: [],
      currentSnapshotIndex: -1,
      snapshotCounter: 0,
      interviews,
      interviewOpportunities: interviewOpportunitiesMap,
      isLoading: false,
    });

    // Create initial snapshot (client-side only)
    const counter = 1;
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    const snapshot: TreeSnapshot = {
      id: `snapshot-${counter}`,
      label: `Sample tree loaded – ${timeLabel}`,
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(seedNodes)),
    };

    set({
      snapshots: [snapshot],
      currentSnapshotIndex: 0,
      snapshotCounter: 1,
    });
  },

  createSnapshot: async (label) => {
    const state = get();
    const tree = state.currentTree;
    if (!tree) return;
    if (tree.isSample) return;

    const counter = state.snapshotCounter + 1;
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const snapshotLabel = label || `v${counter} – ${timeLabel}`;

    const { error } = await supabase.from("snapshots").insert([{
      tree_id: tree.id,
      label: snapshotLabel,
      nodes_data: state.nodes as any,
    }]);

    if (error) {
      console.error("Error creating snapshot:", error);
      return;
    }

    const snapshot: TreeSnapshot = {
      id: `snapshot-${counter}`,
      label: snapshotLabel,
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(state.nodes)),
    };

    const newSnapshots = [...state.snapshots, snapshot].slice(-MAX_SNAPSHOTS);
    set({
      snapshots: newSnapshots,
      snapshotCounter: counter,
      currentSnapshotIndex: newSnapshots.length - 1,
    });
  },

  restoreSnapshot: (snapshotId) => {
    const state = get();
    const snapshotIndex = state.snapshots.findIndex((s) => s.id === snapshotId);
    if (snapshotIndex !== -1) {
      const snapshot = state.snapshots[snapshotIndex];
      set({
        nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
        currentSnapshotIndex: snapshotIndex,
      });
    }
  },

  undo: () => {
    const state = get();
    if (state.currentSnapshotIndex > 0) {
      const newIndex = state.currentSnapshotIndex - 1;
      const previousSnapshot = state.snapshots[newIndex];
      set({
        nodes: JSON.parse(JSON.stringify(previousSnapshot.nodes)),
        currentSnapshotIndex: newIndex,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.currentSnapshotIndex < state.snapshots.length - 1) {
      const newIndex = state.currentSnapshotIndex + 1;
      const nextSnapshot = state.snapshots[newIndex];
      set({
        nodes: JSON.parse(JSON.stringify(nextSnapshot.nodes)),
        currentSnapshotIndex: newIndex,
      });
    }
  },

  canUndo: () => get().currentSnapshotIndex > 0,
  canRedo: () => {
    const state = get();
    return state.currentSnapshotIndex < state.snapshots.length - 1;
  },

  getNodeChildren: (nodeId: string) => {
    const state = get();
    return state.nodes.filter((node) => node.parentId === nodeId);
  },

  getOpportunityStats: (opportunityId: string) => {
    const state = get();
    const children = state.getNodeChildren(opportunityId);
    const solutions = children.filter((n) => n.type === "Solution");
    const allExperiments = children.filter((n) => n.type === "Experiment");

    const solutionsInProgress = solutions.filter((s) => (s as any).status !== "Done" && (s as any).status !== "Backlog").length;

    const experimentsRunning = allExperiments.filter((e) => (e as any).status === "running").length;

    return {
      solutionsCount: solutions.length,
      experimentsCount: allExperiments.length,
      solutionsInProgress,
      experimentsRunning,
    };
  },

  isParentOpportunity: (opportunityId: string) => {
    const state = get();
    return state.nodes.some((n) => n.type === "Opportunity" && n.parentId === opportunityId);
  },

  isSubOpportunity: (opportunityId: string) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === opportunityId);
    return node?.type === "Opportunity" && node.parentId !== null && state.nodes.some((n) => n.id === node.parentId && n.type === "Opportunity");
  },

  canAddSubOpportunity: (opportunityId: string) => {
    const state = get();
    const hasSolutions = state.nodes.some((n) => n.type === "Solution" && n.parentId === opportunityId);
    return !hasSolutions;
  },

  canAddSolution: (opportunityId: string) => {
    const state = get();
    const hasSubOpportunities = state.nodes.some((n) => n.type === "Opportunity" && n.parentId === opportunityId);
    return !hasSubOpportunities;
  },

  getSubOpportunitiesCount: (opportunityId: string) => {
    const state = get();
    return state.nodes.filter((n) => n.type === "Opportunity" && n.parentId === opportunityId).length;
  },

  getBacklogItems: () => {
    const state = get();
    return state.nodes.filter((node) => {
      if (node.type === "Opportunity") return (node as any).status === "backlog";
      if (node.type === "Solution") return (node as any).status === "Backlog";
      if (node.type === "Experiment") return (node as any).status === "backlog" || (node as any).status === "planned";
      return false;
    });
  },

  getRoadmapItems: () => {
    const state = get();
    return state.nodes.filter((node) => {
      if (node.type === "Solution") {
        const status = (node as any).status;
        return status === "Now" || status === "Next" || status === "Later" || status === "Done";
      }
      return false;
    });
  },

  getWorkItems: () => {
    const state = get();
    return state.nodes.filter((node) => {
      if (node.type === "Opportunity") return (node as any).status === "in-discovery";
      if (node.type === "Solution") return (node as any).status === "Now" || (node as any).status === "Next";
      if (node.type === "Experiment") {
        const status = (node as any).status;
        return status === "in-build" || status === "running";
      }
      return false;
    });
  },

  getNodePath: (nodeId: string) => {
    const state = get();
    const path: OSTNode[] = [];
    let currentNode = state.nodes.find((n) => n.id === nodeId);

    while (currentNode?.parentId) {
      const parent = state.nodes.find((n) => n.id === currentNode.parentId);
      if (parent) {
        path.unshift(parent);
        currentNode = parent;
      } else {
        break;
      }
    }

    return path;
  },

  isLeafOpportunity: (opportunityId: string) => {
    const state = get();
    const hasChildren = state.nodes.some((n) => (n.type === "Opportunity" || n.type === "Solution") && n.parentId === opportunityId);
    return !hasChildren;
  },

  getAllOpportunitiesUnderOutcome: (outcomeId: string) => {
    const state = get();
    const opportunities: OSTNode[] = [];

    const collectOpportunities = (parentId: string) => {
      state.nodes.forEach((node) => {
        if (node.parentId === parentId && node.type === "Opportunity") {
          opportunities.push(node);
          collectOpportunities(node.id);
        }
      });
    };

    collectOpportunities(outcomeId);
    return opportunities;
  },

  addInterview: async (interview) => {
    const userId = get().userId;
    if (!userId) return;

    const { error } = await supabase.from("interviews").insert({
      id: interview.id,
      tree_id: interview.treeId,
      user_id: userId,
      transcript: interview.transcript,
      participant_name: interview.participantName,
      conducted_at: interview.conductedAt,
      video_url: interview.videoUrl,
      status: interview.status,
      uploaded_at: interview.uploadedAt,
      created_by: interview.createdBy,
    });

    if (error) {
      console.error("Error adding interview:", error);
      return;
    }

    set((state) => ({
      interviews: [...state.interviews, interview],
    }));
  },

  updateInterview: async (interviewId, updates) => {
    const { error } = await supabase
      .from("interviews")
      .update({
        participant_name: updates.participantName,
        conducted_at: updates.conductedAt,
        video_url: updates.videoUrl,
        status: updates.status,
      })
      .eq("id", interviewId);

    if (error) {
      console.error("Error updating interview:", error);
      return;
    }

    set((state) => ({
      interviews: state.interviews.map((i) => (i.id === interviewId ? { ...i, ...updates } : i)),
    }));
  },

  deleteInterview: async (interviewId) => {
    const { error } = await supabase.from("interviews").delete().eq("id", interviewId);

    if (error) {
      console.error("Error deleting interview:", error);
      return;
    }

    set((state) => {
      const newOpportunities = { ...state.interviewOpportunities };
      delete newOpportunities[interviewId];
      return {
        interviews: state.interviews.filter((i) => i.id !== interviewId),
        interviewOpportunities: newOpportunities,
      };
    });
  },

  getInterviews: () => get().interviews,

  addInterviewOpportunity: async (interviewId, opportunity) => {
    const { error } = await supabase.from("interview_opportunities").insert({
      id: opportunity.id,
      interview_id: interviewId,
      opportunity_node_id: opportunity.opportunityNodeId,
      title: opportunity.title,
      description: opportunity.description,
      why_it_matters: opportunity.whyItMatters,
      evidence_quote: opportunity.evidenceQuote,
      evidence_ref: opportunity.evidenceRef,
      suggested_next_step: opportunity.suggestedNextStep,
      applied: opportunity.applied,
    });

    if (error) {
      console.error("Error adding interview opportunity:", error);
      return;
    }

    set((state) => ({
      interviewOpportunities: {
        ...state.interviewOpportunities,
        [interviewId]: [...(state.interviewOpportunities[interviewId] || []), opportunity],
      },
    }));
  },

  updateInterviewOpportunity: async (interviewId, opportunityId, updates) => {
    const { error } = await supabase
      .from("interview_opportunities")
      .update({
        applied: updates.applied,
        opportunity_node_id: updates.opportunityNodeId,
      })
      .eq("id", opportunityId);

    if (error) {
      console.error("Error updating interview opportunity:", error);
      return;
    }

    set((state) => ({
      interviewOpportunities: {
        ...state.interviewOpportunities,
        [interviewId]: (state.interviewOpportunities[interviewId] || []).map((opp) => (opp.id === opportunityId ? { ...opp, ...updates } : opp)),
      },
    }));
  },

  deleteInterviewOpportunity: async (interviewId, opportunityId) => {
    const { error } = await supabase.from("interview_opportunities").delete().eq("id", opportunityId);

    if (error) {
      console.error("Error deleting interview opportunity:", error);
      return;
    }

    set((state) => ({
      interviewOpportunities: {
        ...state.interviewOpportunities,
        [interviewId]: (state.interviewOpportunities[interviewId] || []).filter((opp) => opp.id !== opportunityId),
      },
    }));
  },

  getInterviewOpportunities: (interviewId) => {
    return get().interviewOpportunities[interviewId] || [];
  },
}));