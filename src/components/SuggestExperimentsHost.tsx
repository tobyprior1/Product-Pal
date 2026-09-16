import { useEffect, useState } from "react"
import { useDataStore } from "@/lib/pm-supabase-store"
import { ExperimentSuggestionsDialog } from "./ExperimentSuggestionsDialog"

interface SuggestTarget {
  id: string
  title: string
}

/**
 * Hosts the AI experiment-suggestions dialog so it can be opened from anywhere
 * (side panel or the canvas pill) via the "suggest-experiments" event.
 */
export function SuggestExperimentsHost() {
  const [target, setTarget] = useState<SuggestTarget | null>(null)

  useEffect(() => {
    const handle = (event: CustomEvent) => {
      const { parentId } = event.detail
      const node = useDataStore.getState().nodes.find((n) => n.id === parentId)
      if (node && node.type === "Solution") {
        setTarget({ id: node.id, title: node.title })
      }
    }

    window.addEventListener("suggest-experiments", handle as EventListener)
    return () => window.removeEventListener("suggest-experiments", handle as EventListener)
  }, [])

  if (!target) return null

  return (
    <ExperimentSuggestionsDialog
      open
      onOpenChange={(open) => {
        if (!open) setTarget(null)
      }}
      solutionId={target.id}
      solutionTitle={target.title}
    />
  )
}
