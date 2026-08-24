import { create } from "zustand"

interface UIStore {
  selectedNodeId: string | null
  focusedNodeId: string | null
  isLocked: boolean
  showCompletedExperiments: boolean
  collapsedOpportunities: Set<string>
  collapsedSolutions: Set<string>

  setSelectedNodeId: (id: string | null) => void
  setFocusedNodeId: (id: string | null) => void
  toggleLock: () => void
  toggleShowCompleted: () => void
  toggleOpportunityCollapse: (opportunityId: string) => void
  toggleSolutionCollapse: (solutionId: string) => void
  setCollapsedOpportunities: (ids: Set<string>) => void
  setCollapsedSolutions: (ids: Set<string>) => void
  resetTreeViewState: () => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  selectedNodeId: null,
  focusedNodeId: null,
  isLocked: false,
  showCompletedExperiments: true,
  collapsedOpportunities: new Set(),
  collapsedSolutions: new Set(),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setFocusedNodeId: (id) => set({ focusedNodeId: id }),

  toggleLock: () => set({ isLocked: !get().isLocked }),

  toggleShowCompleted: () => set({ showCompletedExperiments: !get().showCompletedExperiments }),

  toggleOpportunityCollapse: (opportunityId: string) => {
    const collapsed = new Set(get().collapsedOpportunities)
    if (collapsed.has(opportunityId)) {
      collapsed.delete(opportunityId)
    } else {
      collapsed.add(opportunityId)
    }
    set({ collapsedOpportunities: collapsed })
  },

  toggleSolutionCollapse: (solutionId: string) => {
    const collapsed = new Set(get().collapsedSolutions)
    if (collapsed.has(solutionId)) {
      collapsed.delete(solutionId)
    } else {
      collapsed.add(solutionId)
    }
    set({ collapsedSolutions: collapsed })
  },

  setCollapsedOpportunities: (ids: Set<string>) => set({ collapsedOpportunities: ids }),
  setCollapsedSolutions: (ids: Set<string>) => set({ collapsedSolutions: ids }),
}))
