import { supabase } from "@/integrations/supabase/client";
import type { OSTNode, TreeSnapshot } from "../pm-types";
import { updateNodeMetadata } from "../pm-utils";
import { collectSubtreeIds } from "../pm-selectors";
import type { DataSlice, NodesSlice } from "./types";
import { MAX_SNAPSHOTS } from "./types";
import { ostNodeToDbNode } from "./mappers";
import { notifySampleReadOnly, snapshotTimeLabel, deepCloneNodes } from "./shared";

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
  },

  deleteNode: async (id) => {
    const state = get();
    if (state.currentTree?.isSample) {
      notifySampleReadOnly();
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
