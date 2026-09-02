# AI solution suggestions for opportunities

Add an AI helper to the Opportunity side panel that proposes candidate solutions as inspiration, and lets the user pick which ones become Solution nodes.

## User flow

1. User selects an Opportunity node; the side panel shows a new "Suggest solutions with AI" button next to "Add Solution".
2. Clicking it calls the AI, showing a loading state.
3. A review dialog opens with 4-5 suggested solutions — each with a title, a short description, and a one-line rationale.
4. The user ticks the ones they like and clicks "Add selected". Those are created as Solution child nodes of the opportunity (title + description filled in, status Backlog).
5. "Regenerate" gets a fresh set; closing the dialog adds nothing.

## Rules and edge cases

- The button is disabled with the existing granularity tooltip when the opportunity already has sub-opportunities (same rule as "Add Solution").
- Disabled on the read-only sample tree and when the canvas is locked.
- Errors (no credits, rate limit, model failure) surface as a clear message in the dialog with a retry option, never a silent failure.

## Context sent to the AI

The opportunity title, evidence summary, tags and status, plus the parent outcome's title/metric and the titles of any existing sibling solutions so suggestions don't duplicate what's already there.

## Technical notes

- New edge function `supabase/functions/suggest-solutions/index.ts`: validates the caller's JWT, loads the opportunity and its tree context from the database (owner-scoped), calls the Lovable AI Gateway with a structured JSON schema, and returns `{ suggestions: [{ title, description, rationale }] }`. Uses the existing `LOVABLE_API_KEY` secret — no new keys or tables.
- Prompt framed on continuous-discovery practice: small, testable, iterative solutions addressing the specific opportunity, not big projects.
- New client component `src/components/SolutionSuggestionsDialog.tsx` for the review list, plus a compact AI button added to `src/components/AddChildPanelButton.tsx` (side panel only).
- Selected suggestions are created through the existing `addNode` path in the store, so undo snapshots, layout, and persistence work unchanged.
- No database schema changes; suggestions are not persisted unless added as nodes.
