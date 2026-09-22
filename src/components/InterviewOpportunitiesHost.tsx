import { useEffect, useState } from "react"
import { useDataStore } from "@/lib/pm-supabase-store"
import { InterviewOpportunitiesDialog } from "./InterviewOpportunitiesDialog"

interface Target {
  id: string
  title: string
}

/**
 * Hosts the "paste interview → get opportunities" dialog so it can open from
 * the outcome side panel or the canvas pill via the "extract-opportunities" event.
 */
export function InterviewOpportunitiesHost() {
  const [target, setTarget] = useState<Target | null>(null)

  useEffect(() => {
    const handle = (event: CustomEvent) => {
      const { parentId } = event.detail
      const node = useDataStore.getState().nodes.find((n) => n.id === parentId)
      if (node && node.type === "Outcome") {
        setTarget({ id: node.id, title: node.title })
      }
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
      outcomeId={target.id}
      outcomeTitle={target.title}
    />
  )
}
