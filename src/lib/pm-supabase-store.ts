import { create } from "zustand";
import { initialDataState, type DataStore } from "./store/types";
import { createTreesSlice } from "./store/trees-slice";
import { createProjectsSlice } from "./store/projects-slice";
import { createNodesSlice } from "./store/nodes-slice";
import { createSnapshotsSlice } from "./store/snapshots-slice";
import { createSelectorsSlice } from "./store/selectors-slice";
import { createInterviewsSlice } from "./store/interviews-slice";

/**
 * Single application data store, composed from focused slices in `./store`.
 * The public API is unchanged — every consumer keeps importing `useDataStore`.
 */
export const useDataStore = create<DataStore>()((...a) => ({
  ...initialDataState,
  ...createTreesSlice(...a),
  ...createProjectsSlice(...a),
  ...createNodesSlice(...a),
  ...createSnapshotsSlice(...a),
  ...createSelectorsSlice(...a),
  ...createInterviewsSlice(...a),
}));

export type { DataStore };
