import { useCallback, useState } from "react"

/**
 * Tracks which single CTA is currently running.
 *
 * Only the clicked action gets the real `disabled` attribute (and its loading
 * label); other actions are blocked with `aria-disabled` + `pointer-events-none`
 * so they don't inherit the button's disabled fade.
 */
export function usePendingAction() {
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const isBusy = pendingAction !== null

  /** Runs `fn` under `actionId`, ignoring the call if another action is running. */
  const run = useCallback(
    async (actionId: string, fn: () => void | Promise<void>) => {
      if (pendingAction !== null) return
      setPendingAction(actionId)
      try {
        await fn()
      } finally {
        setPendingAction(null)
      }
    },
    [pendingAction],
  )

  const isPending = useCallback((actionId: string) => pendingAction === actionId, [pendingAction])

  /** Props to spread on a CTA so only the active one shows the disabled state. */
  const actionProps = useCallback(
    (actionId: string) => ({
      disabled: pendingAction === actionId,
      "aria-disabled": isBusy,
      className: isBusy && pendingAction !== actionId ? "pointer-events-none" : undefined,
    }),
    [pendingAction, isBusy],
  )

  return { pendingAction, isBusy, isPending, run, actionProps }
}
