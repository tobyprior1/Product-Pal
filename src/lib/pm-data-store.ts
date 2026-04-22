import { create } from "zustand"
import type { OSTNode, TreeSnapshot, Tree, Interview } from "./pm-types"
import { getSeedData } from "./pm-seed-data"
import { generateUUID, createTimestamp, updateNodeMetadata } from "./pm-utils"
import { useUIStore } from "./pm-ui-store"

interface DataStore {
  currentTree: Tree | null
  nodes: OSTNode[]
  snapshots: TreeSnapshot[]
  currentSnapshotIndex: number
  snapshotCounter: number
  interviews: Interview[]
  interviewOpportunities: Record<string, any[]>

  setCurrentTree: (tree: Tree) => void
  updateTreeMetadata: () => void
  setNodes: (nodes: OSTNode[]) => void
  addNode: (node: OSTNode) => void
  updateNode: (id: string, updates: Partial<OSTNode>, userId?: string) => void
  deleteNode: (id: string) => void
  loadSeedData: () => string
  clearTree: () => void
  createSnapshot: (label?: string) => void
  restoreSnapshot: (snapshotId: string) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  getNodeChildren: (nodeId: string) => OSTNode[]
  getOpportunityStats: (opportunityId: string) => {
    solutionsCount: number
    experimentsCount: number
    solutionsInProgress: number
    experimentsRunning: number
  }
  isParentOpportunity: (opportunityId: string) => boolean
  isSubOpportunity: (opportunityId: string) => boolean
  canAddSubOpportunity: (opportunityId: string) => boolean
  canAddSolution: (opportunityId: string) => boolean
  getSubOpportunitiesCount: (opportunityId: string) => number
  getBacklogItems: () => OSTNode[]
  getRoadmapItems: () => OSTNode[]
  getWorkItems: () => OSTNode[]
  getNodePath: (nodeId: string) => OSTNode[]
  isLeafOpportunity: (opportunityId: string) => boolean
  getAllOpportunitiesUnderOutcome: (outcomeId: string) => OSTNode[]
  addInterview: (interview: Interview) => void
  updateInterview: (interviewId: string, updates: Partial<Interview>) => void
  deleteInterview: (interviewId: string) => void
  getInterviews: () => Interview[]
  addInterviewOpportunity: (interviewId: string, opportunity: any) => void
  updateInterviewOpportunity: (interviewId: string, opportunityId: string, updates: any) => void
  deleteInterviewOpportunity: (interviewId: string, opportunityId: string) => void
  getInterviewOpportunities: (interviewId: string) => any[]
}

const MAX_SNAPSHOTS = 10

export const useDataStore = create<DataStore>((set, get) => ({
  currentTree: null,
  nodes: [],
  snapshots: [],
  currentSnapshotIndex: -1,
  snapshotCounter: 0,
  interviews: [],
  interviewOpportunities: {},

  setCurrentTree: (tree) => set({ currentTree: tree }),

  updateTreeMetadata: () => {
    const tree = get().currentTree
    if (tree) {
      set({
        currentTree: {
          ...tree,
          updatedAt: createTimestamp(),
        },
      })
    }
  },

  setNodes: (nodes) => {
    const state = get()
    const counter = state.snapshotCounter + 1
    const now = new Date()
    const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    const snapshot: TreeSnapshot = {
      id: `snapshot-${counter}`,
      label: `v${counter} – ${timeLabel}`,
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(nodes)),
    }

    const newSnapshots = state.snapshots.slice(0, state.currentSnapshotIndex + 1)
    newSnapshots.push(snapshot)
    const trimmedSnapshots = newSnapshots.slice(-MAX_SNAPSHOTS)

    set({
      nodes,
      snapshots: trimmedSnapshots,
      currentSnapshotIndex: trimmedSnapshots.length - 1,
      snapshotCounter: counter,
    })

    state.updateTreeMetadata()
  },

  addNode: (node) => {
    const state = get()
    state.setNodes([...state.nodes, node])
  },

  updateNode: (id, updates, userId) => {
    const state = get()
    const metadata = updateNodeMetadata(userId)
    const updatedNodes = state.nodes.map((node) => 
      node.id === id ? ({ ...node, ...updates, ...metadata } as OSTNode) : node
    )
    state.setNodes(updatedNodes)
  },

  deleteNode: (id) => {
    const state = get()
    const nodesToDelete = new Set<string>([id])

    const findChildren = (parentId: string) => {
      state.nodes.forEach((node) => {
        if (node.parentId === parentId) {
          nodesToDelete.add(node.id)
          findChildren(node.id)
        }
      })
    }

    findChildren(id)
    const filteredNodes = state.nodes.filter((node) => !nodesToDelete.has(node.id))
    state.setNodes(filteredNodes)
  },

  loadSeedData: () => {
    const seedNodes = getSeedData()

    const doneSolutions = seedNodes
      .filter((node) => node.type === "Solution" && node.status === "Done")
      .map((node) => node.id)

    const backlogOpportunities = seedNodes
      .filter((node) => node.type === "Opportunity" && node.status === "backlog")
      .map((node) => node.id)

    useUIStore.getState().setCollapsedSolutions(new Set(doneSolutions))
    useUIStore.getState().setCollapsedOpportunities(new Set(backlogOpportunities))

    const defaultTree: Tree = {
      id: generateUUID(),
      name: "Sample Tree",
      description: "A sample Opportunity Solution Tree",
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
    }

    set({
      currentTree: defaultTree,
      nodes: seedNodes,
      snapshots: [],
      currentSnapshotIndex: -1,
      snapshotCounter: 0,
    })

    get().createSnapshot("Initial state")

    return defaultTree.id
  },

  clearTree: () => {
    const emptyTree: Tree = {
      id: generateUUID(),
      name: "New Tree",
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
    }

    set({
      currentTree: emptyTree,
      nodes: [],
      snapshots: [],
      currentSnapshotIndex: -1,
      snapshotCounter: 0,
    })

    get().createSnapshot("Empty tree")
  },

  createSnapshot: (label) => {
    const state = get()
    const counter = state.snapshotCounter + 1
    const now = new Date()
    const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    const snapshot: TreeSnapshot = {
      id: `snapshot-${counter}`,
      label: label || `v${counter} – ${timeLabel}`,
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(state.nodes)),
    }

    const newSnapshots = [...state.snapshots, snapshot].slice(-MAX_SNAPSHOTS)
    set({
      snapshots: newSnapshots,
      snapshotCounter: counter,
      currentSnapshotIndex: newSnapshots.length - 1,
    })
  },

  restoreSnapshot: (snapshotId) => {
    const state = get()
    const snapshotIndex = state.snapshots.findIndex((s) => s.id === snapshotId)
    if (snapshotIndex !== -1) {
      const snapshot = state.snapshots[snapshotIndex]
      set({
        nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
        currentSnapshotIndex: snapshotIndex,
      })
    }
  },

  undo: () => {
    const state = get()
    if (state.currentSnapshotIndex > 0) {
      const newIndex = state.currentSnapshotIndex - 1
      const previousSnapshot = state.snapshots[newIndex]
      set({
        nodes: JSON.parse(JSON.stringify(previousSnapshot.nodes)),
        currentSnapshotIndex: newIndex,
      })
    }
  },

  redo: () => {
    const state = get()
    if (state.currentSnapshotIndex < state.snapshots.length - 1) {
      const newIndex = state.currentSnapshotIndex + 1
      const nextSnapshot = state.snapshots[newIndex]
      set({
        nodes: JSON.parse(JSON.stringify(nextSnapshot.nodes)),
        currentSnapshotIndex: newIndex,
      })
    }
  },

  canUndo: () => get().currentSnapshotIndex > 0,
  canRedo: () => {
    const state = get()
    return state.currentSnapshotIndex < state.snapshots.length - 1
  },

  getNodeChildren: (nodeId: string) => {
    const state = get()
    return state.nodes.filter((node) => node.parentId === nodeId)
  },

  getOpportunityStats: (opportunityId: string) => {
    const state = get()
    const children = state.getNodeChildren(opportunityId)
    const solutions = children.filter((n) => n.type === "Solution")
    const allExperiments = children.filter((n) => n.type === "Experiment")
    
    const solutionsInProgress = solutions.filter(
      (s) => (s as any).status !== "Done" && (s as any).status !== "Backlog"
    ).length
    
    const experimentsRunning = allExperiments.filter(
      (e) => (e as any).status === "running"
    ).length

    return {
      solutionsCount: solutions.length,
      experimentsCount: allExperiments.length,
      solutionsInProgress,
      experimentsRunning,
    }
  },

  isParentOpportunity: (opportunityId: string) => {
    const state = get()
    return state.nodes.some((n) => n.type === "Opportunity" && n.parentId === opportunityId)
  },

  isSubOpportunity: (opportunityId: string) => {
    const state = get()
    const node = state.nodes.find((n) => n.id === opportunityId)
    return node?.type === "Opportunity" && node.parentId !== null && 
           state.nodes.some((n) => n.id === node.parentId && n.type === "Opportunity")
  },

  canAddSubOpportunity: (opportunityId: string) => {
    const state = get()
    const hasSolutions = state.nodes.some((n) => n.type === "Solution" && n.parentId === opportunityId)
    return !hasSolutions
  },

  canAddSolution: (opportunityId: string) => {
    const state = get()
    const hasSubOpportunities = state.nodes.some((n) => n.type === "Opportunity" && n.parentId === opportunityId)
    return !hasSubOpportunities
  },

  getSubOpportunitiesCount: (opportunityId: string) => {
    const state = get()
    return state.nodes.filter((n) => n.type === "Opportunity" && n.parentId === opportunityId).length
  },

  getBacklogItems: () => {
    const state = get()
    return state.nodes.filter((node) => {
      if (node.type === "Opportunity") return (node as any).status === "backlog"
      if (node.type === "Solution") return (node as any).status === "Backlog"
      if (node.type === "Experiment") return (node as any).status === "backlog" || (node as any).status === "planned"
      return false
    })
  },

  getRoadmapItems: () => {
    const state = get()
    return state.nodes.filter((node) => {
      if (node.type === "Solution") {
        const status = (node as any).status
        return status === "Now" || status === "Next" || status === "Later" || status === "Done"
      }
      return false
    })
  },

  getWorkItems: () => {
    const state = get()
    return state.nodes.filter((node) => {
      if (node.type === "Opportunity") return (node as any).status === "in-discovery"
      if (node.type === "Solution") return (node as any).status === "Now" || (node as any).status === "Next"
      if (node.type === "Experiment") {
        const status = (node as any).status
        return status === "in-build" || status === "running"
      }
      return false
    })
  },

  getNodePath: (nodeId: string) => {
    const state = get()
    const path: OSTNode[] = []
    let currentNode = state.nodes.find((n) => n.id === nodeId)
    
    while (currentNode?.parentId) {
      const parent = state.nodes.find((n) => n.id === currentNode.parentId)
      if (parent) {
        path.unshift(parent)
        currentNode = parent
      } else {
        break
      }
    }
    
    return path
  },

  isLeafOpportunity: (opportunityId: string) => {
    const state = get()
    const hasChildren = state.nodes.some((n) => 
      (n.type === "Opportunity" || n.type === "Solution") && n.parentId === opportunityId
    )
    return !hasChildren
  },

  getAllOpportunitiesUnderOutcome: (outcomeId: string) => {
    const state = get()
    const opportunities: OSTNode[] = []
    
    const collectOpportunities = (parentId: string) => {
      state.nodes.forEach((node) => {
        if (node.parentId === parentId && node.type === "Opportunity") {
          opportunities.push(node)
          collectOpportunities(node.id)
        }
      })
    }
    
    collectOpportunities(outcomeId)
    return opportunities
  },

  addInterview: (interview) => {
    set((state) => ({
      interviews: [...state.interviews, interview],
    }))
  },

  updateInterview: (interviewId, updates) => {
    set((state) => ({
      interviews: state.interviews.map((i) => 
        i.id === interviewId ? { ...i, ...updates } : i
      ),
    }))
  },

  deleteInterview: (interviewId) => {
    set((state) => {
      const newOpportunities = { ...state.interviewOpportunities }
      delete newOpportunities[interviewId]
      return {
        interviews: state.interviews.filter((i) => i.id !== interviewId),
        interviewOpportunities: newOpportunities,
      }
    })
  },

  getInterviews: () => get().interviews,

  addInterviewOpportunity: (interviewId, opportunity) => {
    set((state) => ({
      interviewOpportunities: {
        ...state.interviewOpportunities,
        [interviewId]: [...(state.interviewOpportunities[interviewId] || []), opportunity],
      },
    }))
  },

  updateInterviewOpportunity: (interviewId, opportunityId, updates) => {
    set((state) => ({
      interviewOpportunities: {
        ...state.interviewOpportunities,
        [interviewId]: (state.interviewOpportunities[interviewId] || []).map((opp) =>
          opp.id === opportunityId ? { ...opp, ...updates } : opp
        ),
      },
    }))
  },

  deleteInterviewOpportunity: (interviewId, opportunityId) => {
    set((state) => ({
      interviewOpportunities: {
        ...state.interviewOpportunities,
        [interviewId]: (state.interviewOpportunities[interviewId] || []).filter(
          (opp) => opp.id !== opportunityId
        ),
      },
    }))
  },

  getInterviewOpportunities: (interviewId) => {
    return get().interviewOpportunities[interviewId] || []
  },
}))
