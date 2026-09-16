import { useEffect, useState } from "react"
import { useDataStore } from "@/lib/pm-supabase-store"
import { SolutionSuggestionsDialog } from "./SolutionSuggestionsDialog"

/** The opportunity the AI suggestions dialog was opened for. */
interface SuggestTarget {
  id: string
  title: string
}

/**
 * Hosts the AI solution-suggestions dialog so it can be opened from anywhere
 * (side panel button or the canvas pill) via the "suggest-solutions" event -
 * independent of which node is currently selected.
 */
export function SuggestSolutionsHost() {
  const [target, setTarget] = useState<SuggestTarget | null>(null)

  useEffect(() => {
    const handleSuggestSolutions = (event: CustomEvent) => {
      const { parentId } = event.detail
      const node = useDataStore.getState().nodes.find((n) => n.id === parentId)
      if (node && node.type === "Opportunity") {
        setTarget({ id: node.id, title: node.title })
      }
    }

    window.addEventListener("suggest-solutions", handleSuggestSolutions as EventListener)
    return () => window.removeEventListener("suggest-solutions", handleSuggestSolutions as EventListener)
  }, [])

  if (!target) return null

  return (
    <SolutionSuggestionsDialog
      open
      onOpenChange={(open) => {
        if (!open) setTarget(null)
      }}
      opportunityId={target.id}
      opportunityTitle={target.title}
    />
  )
}
