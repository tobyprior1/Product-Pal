import { supabase } from "@/integrations/supabase/client";
import type { TreeSnapshot } from "../pm-types";
import type { DataSlice, SnapshotsSlice } from "./types";
import { MAX_SNAPSHOTS } from "./types";
import { snapshotTimeLabel, deepCloneNodes } from "./shared";

export const createSnapshotsSlice: DataSlice<SnapshotsSlice> = (set, get) => ({
  createSnapshot: async (label) => {
    const state = get();
    const tree = state.currentTree;
    if (!tree || tree.isSample) return;

    const counter = state.snapshotCounter + 1;
    const snapshotLabel = label || `v${counter} – ${snapshotTimeLabel()}`;

    const { error } = await supabase.from("snapshots").insert([
      {
        tree_id: tree.id,
        label: snapshotLabel,
        nodes_data: state.nodes as any,
      },
    ]);

    if (error) {
      console.error("Error creating snapshot:", error);
      return;
    }

    const snapshot: TreeSnapshot = {
      id: `snapshot-${counter}`,
      label: snapshotLabel,
      timestamp: Date.now(),
      nodes: deepCloneNodes(state.nodes),
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
    if (snapshotIndex === -1) return;

    set({
      nodes: deepCloneNodes(state.snapshots[snapshotIndex].nodes),
      currentSnapshotIndex: snapshotIndex,
    });
  },

  undo: () => {
    const state = get();
    if (state.currentSnapshotIndex <= 0) return;

    const newIndex = state.currentSnapshotIndex - 1;
    set({
      nodes: deepCloneNodes(state.snapshots[newIndex].nodes),
      currentSnapshotIndex: newIndex,
    });
  },

  redo: () => {
    const state = get();
    if (state.currentSnapshotIndex >= state.snapshots.length - 1) return;

    const newIndex = state.currentSnapshotIndex + 1;
    set({
      nodes: deepCloneNodes(state.snapshots[newIndex].nodes),
      currentSnapshotIndex: newIndex,
    });
  },

  canUndo: () => get().currentSnapshotIndex > 0,

  canRedo: () => {
    const state = get();
    return state.currentSnapshotIndex < state.snapshots.length - 1;
  },
});
