const FALLBACK = "Couldn't reach the AI right now. Please try again."

function messageFrom(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined
  const value = body as Record<string, unknown>
  for (const field of [value.error, value.message]) {
    if (typeof field === "string" && field.trim()) return field.trim()
  }
  return undefined
}

/** Function HTTP failures keep their JSON body on error.context, not data. */
export async function getAiFunctionError(data: unknown, error: unknown): Promise<string> {
  const direct = messageFrom(data)
  if (direct) return direct
  const context = error && typeof error === "object" && "context" in error ? error.context : undefined
  if (!(context instanceof Response)) return FALLBACK
  try {
    const body: unknown = await context.clone().json()
    if (body && typeof body === "object" && "code" in body && body.code === "IDLE_TIMEOUT") {
      return "The AI request timed out after 150 seconds. No solutions or opportunities were added. Please try again later."
    }
    const message = messageFrom(body)
    if (message) return message
  } catch {
    // An HTML error page or unreadable body should never leave loading stuck.
  }
  if (context.status === 504) return "The AI request timed out. Please try again later."
  if (context.status === 401) return "Your session has expired. Please sign in again."
  if (context.status === 429) return "The AI rate limit was reached. Please try again later."
  return FALLBACK
}