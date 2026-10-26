import { supabase } from "@/integrations/supabase/client";
import type { OSTNode, TreeSnapshot } from "../pm-types";
import { updateNodeMetadata } from "../pm-utils";
import { collectSubtreeIds } from "../pm-selectors";
import type { DataSlice, NodesSlice } from "./types";
import { MAX_SNAPSHOTS } from "./types";
import { ostNodeToDbNode, dbNodeToOSTNode } from "./mappers";
import { notifySampleReadOnly, snapshotTimeLabel, deepCloneNodes, showErrorToast } from "./shared";

export const createNodesSlice: DataSlice<NodesSlice> = (set, get) => ({
  /** Replaces the node list and records a local undo snapshot. */
  setNodes: (nodes) => {
    const state = get();
    const counter = state.snapshotCounter + 1;

    const snapshot: TreeSnapshot = {
      id: `snapshot-${counter}`,
      label: `v${counter} – ${snapshotTimeLabel()}`,
      timestamp: Date.now(),
      nodes: deepCloneNodes(nodes),
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

  addBusinessOutcome: async (productOutcomeId, title) => {
    const state = get();
    if (!state.currentTree) return null;
    if (state.currentTree.isSample) { notifySampleReadOnly(); return null; }
    const { data: id, error } = await supabase.rpc("attach_business_outcome", {
      p_outcome_id: productOutcomeId, p_title: title,
    });
    if (error || !id) { showErrorToast("Business outcome could not be saved. Please try again."); return null; }
    const { data: row, error: readError } = await supabase.from("nodes").select("*").eq("id", id).single();
    if (readError || !row) {
      await state.selectTree(state.currentTree.id);
      return id;
    }
    const latest = get();
    if (latest.currentTree?.id !== state.currentTree.id) return id;
    const product = latest.nodes.find(n => n.id === productOutcomeId);
    const parent = latest.nodes.find(n => n.id === product?.parentId);
    const childId = parent?.type === "ProductNorthStar" ? parent.id : productOutcomeId;
    latest.setNodes([...latest.nodes.map(n => n.id === childId ? { ...n, parentId: id } : n), dbNodeToOSTNode(row)]);
    return id;
  },

  addProductNorthStar: async (productOutcomeId, title) => {
    const state = get();
    if (!state.currentTree) return null;
    if (state.currentTree.isSample) { notifySampleReadOnly(); return null; }
    const { data: id, error } = await supabase.rpc("attach_product_north_star", { p_outcome_id: productOutcomeId, p_title: title });
    if (error || !id) { showErrorToast("Product North Star could not be saved. Please try again."); return null; }
    const { data: row, error: readError } = await supabase.from("nodes").select("*").eq("id", id).single();
    if (readError || !row) { await state.selectTree(state.currentTree.id); return id; }
    const latest = get();
    if (latest.currentTree?.id !== state.currentTree.id) return id;
    latest.setNodes([...latest.nodes.map(n => n.id === productOutcomeId ? { ...n, parentId: id } : n), dbNodeToOSTNode(row)]);
    return id;
  },

  addNode: async (node) => {
    const state = get();
    const tree = state.currentTree;
    if (!tree) return false;
    if (tree.isSample) {
      notifySampleReadOnly();
      return false;
    }

    const { error } = await supabase
      .from("nodes")
      .insert([ostNodeToDbNode(node, tree.id) as any]);

    if (error) {
      console.error("Error adding node:", error);
      return false;
    }

    state.setNodes([...state.nodes, node]);

    // Keep the outcome (tree) name in sync with its root Outcome node
    if (node.type === "Outcome" && node.title && node.title !== tree.name) {
      await state.renameTree(tree.id, node.title);
    }
    return true;
  },

  updateNode: async (id, updates, userId) => {
    const state = get();
    const tree = state.currentTree;
    if (!tree) return;
    if (tree.isSample) {
      notifySampleReadOnly();
      return;
    }

    const existing = state.nodes.find((n) => n.id === id);
    if (!existing) return;

    const mergedNode = { ...existing, ...updates, ...updateNodeMetadata(userId) } as OSTNode;

    const { error } = await supabase
      .from("nodes")
      .update(ostNodeToDbNode(mergedNode, tree.id) as any)
      .eq("id", id);

    if (error) {
      console.error("Error updating node:", error);
      return;
    }

    state.setNodes(state.nodes.map((node) => (node.id === id ? mergedNode : node)));

    // Keep the outcome (tree) name in sync with its root Outcome node title
    if (
      mergedNode.type === "Outcome" &&
      updates.title &&
      mergedNode.title !== tree.name
    ) {
      await state.renameTree(tree.id, mergedNode.title);
    }
  },

  deleteNode: async (id) => {
    const state = get();
    if (state.currentTree?.isSample) {
      notifySampleReadOnly();
      return;
    }

    const node = state.nodes.find(n => n.id === id);
    if (node?.type === "BusinessOutcome" || node?.type === "ProductNorthStar") {
      const { error } = node.type === "ProductNorthStar"
        ? await supabase.rpc("remove_product_north_star", { p_north_star_id: id })
        : await supabase.rpc("remove_business_outcome", { p_business_id: id });
      if (error) { showErrorToast("Strategic goal could not be removed."); return; }
      if (get().currentTree?.id !== state.currentTree?.id) return;
      state.setNodes(get().nodes.filter(n => n.id !== id).map(n => n.parentId === id ? { ...n, parentId: node.parentId } : n));
      return;
    }

    const nodesToDelete = collectSubtreeIds(state.nodes, id);

    const { error } = await supabase
      .from("nodes")
      .delete()
      .in("id", Array.from(nodesToDelete));

    if (error) {
      console.error("Error deleting nodes:", error);
      return;
    }

    state.setNodes(state.nodes.filter((node) => !nodesToDelete.has(node.id)));
  },
});
