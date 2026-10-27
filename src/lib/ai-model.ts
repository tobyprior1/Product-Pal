// Human-readable names for the AI models the backend can report back.

const MODEL_LABELS: Record<string, string> = {
  "gemini-3.8-flash": "Gemini 3.8 Flash",
  "gemini-3.6-flash": "Gemini 3.6 Flash",
  "gemini-3.5-flash-lite": "Gemini 3.5 Flash-Lite",
}

/**
 * Turns a model id such as "gemini-3.5-flash-lite" into "Gemini 3.5 Flash-Lite".
 * Returns null when no model was reported, so callers can hide the label entirely
 * rather than showing "Unknown".
 */
export function formatAiModelName(model?: string | null): string | null {
  const trimmed = model?.trim()
  if (!trimmed) return null

  const known = MODEL_LABELS[trimmed.toLowerCase()]
  if (known) return known

  return trimmed
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => (/^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ")
}
