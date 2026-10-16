import { useEffect, useState } from "react"
import { useDataStore } from "@/lib/pm-supabase-store"
import { InterviewOpportunitiesDialog } from "./InterviewOpportunitiesDialog"

interface Target {
  outcomeId: string
  outcomeTitle: string
  parentId: string
}

/**
 * Hosts the "customer evidence → opportunities" dialog (interview or feedback CSV).
 * Opens via the "extract-opportunities" event from the Outcome or an Opportunity.
 */
export function InterviewOpportunitiesHost() {
  const [target, setTarget] = useState<Target | null>(null)

  useEffect(() => {
    const handle = (event: CustomEvent) => {
      const { parentId } = event.detail
      const nodes = useDataStore.getState().nodes
      const node = nodes.find((n) => n.id === parentId)
      const outcome = nodes.find((n) => n.type === "Outcome")
      if (!node || !outcome || (node.type !== "Outcome" && node.type !== "Opportunity")) return
      setTarget({ outcomeId: outcome.id, outcomeTitle: outcome.title, parentId: node.id })
    }

    window.addEventListener("extract-opportunities", handle as EventListener)
    return () => window.removeEventListener("extract-opportunities", handle as EventListener)
  }, [])

  if (!target) return null

  return (
    <InterviewOpportunitiesDialog
      open
      onOpenChange={(open) => {
        if (!open) setTarget(null)
      }}
      outcomeId={target.outcomeId}
      outcomeTitle={target.outcomeTitle}
      defaultParentId={target.parentId}
    />
  )
}
