import type { StateCreator } from "zustand";
import type { OSTNode, TreeSnapshot, Tree, Interview, Project } from "../pm-types";
import type { OpportunityStats } from "../pm-selectors";

export interface DataStoreState {
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
}

export interface TreesSlice {
  setUserId: (userId: string | null) => void;
  loadUserData: () => Promise<void>;
  selectTree: (treeId: string) => Promise<void>;
  deleteTree: (treeId: string) => Promise<void>;
  renameTree: (treeId: string, newName: string) => Promise<void>;
  assignTreeToProject: (treeId: string, projectId: string | null) => Promise<void>;
  setCurrentTree: (tree: Tree) => Promise<void>;
  updateTreeMetadata: () => Promise<void>;
  createNewTree: (name?: string, projectId?: string | null) => Promise<string>;
  loadSampleTree: () => Promise<void>;
}

export interface ProjectsSlice {
  loadProjects: () => Promise<void>;
  createProject: (
    name: string,
    description?: string,
    context?: { productContext?: string; targetUsers?: string; constraints?: string },
  ) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export interface NodesSlice {
  setNodes: (nodes: OSTNode[]) => void;
  addNode: (node: OSTNode) => Promise<boolean>;
  updateNode: (id: string, updates: Partial<OSTNode>, userId?: string) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
}

export interface SnapshotsSlice {
  createSnapshot: (label?: string) => Promise<void>;
  restoreSnapshot: (snapshotId: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export interface SelectorsSlice {
  getNodeChildren: (nodeId: string) => OSTNode[];
  getOpportunityStats: (opportunityId: string) => OpportunityStats;
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
}

export interface InterviewsSlice {
  addInterview: (interview: Interview) => Promise<void>;
  updateInterview: (interviewId: string, updates: Partial<Interview>) => Promise<void>;
  deleteInterview: (interviewId: string) => Promise<void>;
  getInterviews: () => Interview[];
  addInterviewOpportunity: (interviewId: string, opportunity: any) => Promise<void>;
  updateInterviewOpportunity: (
    interviewId: string,
    opportunityId: string,
    updates: any
  ) => Promise<void>;
  deleteInterviewOpportunity: (interviewId: string, opportunityId: string) => Promise<void>;
  getInterviewOpportunities: (interviewId: string) => any[];
}

export type DataStore = DataStoreState &
  TreesSlice &
  ProjectsSlice &
  NodesSlice &
  SnapshotsSlice &
  SelectorsSlice &
  InterviewsSlice;

/** Zustand slice creator bound to the composed store type. */
export type DataSlice<T> = StateCreator<DataStore, [], [], T>;

export const MAX_SNAPSHOTS = 10;

export const initialDataState: DataStoreState = {
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
};
