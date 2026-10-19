/** Minimal RFC 4180 CSV parser: quoted fields, escaped quotes, CRLF/LF, embedded newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  const src = text.replace(/^\uFEFF/, "")

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ",") {
      row.push(field)
      field = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else field += ch
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0))
}

const TEXT_HINTS = ["feedback", "comment", "message", "review", "response", "pain", "note", "text", "body", "verbatim"]

/** Columns that name a row rather than hold what the customer said — "response_id"
 *  looks like a feedback column by name alone, but only holds "1", "2", "3". */
const ID_HINTS = ["id", "uuid", "key", "number", "num", "no", "date", "time", "timestamp", "score", "rating"]

const isIdLike = (header: string) => {
  const h = header.toLowerCase().replace(/[\s-]+/g, "_")
  return ID_HINTS.some((hint) => h === hint || h.endsWith(`_${hint}`) || h.startsWith(`${hint}_`))
}

const isNumericColumn = (rows: string[][], col: number) =>
  rows.some((r) => (r[col] ?? "").trim() !== "") &&
  rows.every((r) => {
    const v = (r[col] ?? "").trim()
    return v === "" || !Number.isNaN(Number(v))
  })

/** Guess the column most likely to hold free-text feedback: name hint first, then longest average text. */
export function guessFeedbackColumn(headers: string[], rows: string[][]): number {
  const usable = headers.map((h) => !isIdLike(h))
  const hinted = headers.findIndex((h, i) => usable[i] && TEXT_HINTS.some((hint) => h.toLowerCase().includes(hint)))
  if (hinted >= 0) return hinted
  let best = 0
  let bestLen = -1
  headers.forEach((_, col) => {
    if (!usable[col] || isNumericColumn(rows, col)) return
    const avg = rows.reduce((sum, r) => sum + (r[col]?.length ?? 0), 0) / Math.max(rows.length, 1)
    if (avg > bestLen) {
      bestLen = avg
      best = col
    }
  })
  return best
}

export const MAX_FEEDBACK_ROWS = 500

/** Turn mapped CSV rows into numbered lines for the AI, dropping empties and capping volume. */
export function buildFeedbackText(rows: string[][], textCol: number, segmentCol: number | null): { text: string; count: number } {
  const lines: string[] = []
  for (const r of rows) {
    const body = (r[textCol] ?? "").replace(/\s+/g, " ").trim()
    if (!body) continue
    const segment = segmentCol !== null ? (r[segmentCol] ?? "").trim() : ""
    lines.push(`${lines.length + 1}. ${segment ? `[${segment}] ` : ""}${body.slice(0, 600)}`)
    if (lines.length >= MAX_FEEDBACK_ROWS) break
  }
  return { text: lines.join("\n"), count: lines.length }
}
