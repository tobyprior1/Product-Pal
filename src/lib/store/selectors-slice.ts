import * as selectors from "../pm-selectors";
import type { DataSlice, SelectorsSlice } from "./types";

/** Thin store-bound wrappers around the pure selectors in `pm-selectors`. */
export const createSelectorsSlice: DataSlice<SelectorsSlice> = (_set, get) => ({
  getNodeChildren: (nodeId) => selectors.getNodeChildren(get().nodes, nodeId),
  getOpportunityStats: (opportunityId) => selectors.getOpportunityStats(get().nodes, opportunityId),
  isParentOpportunity: (opportunityId) => selectors.isParentOpportunity(get().nodes, opportunityId),
  isSubOpportunity: (opportunityId) => selectors.isSubOpportunity(get().nodes, opportunityId),
  canAddSubOpportunity: (opportunityId) =>
    selectors.canAddSubOpportunity(get().nodes, opportunityId),
  canAddSolution: (opportunityId) => selectors.canAddSolution(get().nodes, opportunityId),
  getSubOpportunitiesCount: (opportunityId) =>
    selectors.getSubOpportunitiesCount(get().nodes, opportunityId),
  getBacklogItems: () => selectors.getBacklogItems(get().nodes),
  getRoadmapItems: () => selectors.getRoadmapItems(get().nodes),
  getWorkItems: () => selectors.getWorkItems(get().nodes),
  getNodePath: (nodeId) => selectors.getNodePath(get().nodes, nodeId),
  isLeafOpportunity: (opportunityId) => selectors.isLeafOpportunity(get().nodes, opportunityId),
  getAllOpportunitiesUnderOutcome: (outcomeId) =>
    selectors.getAllOpportunitiesUnderOutcome(get().nodes, outcomeId),
});
