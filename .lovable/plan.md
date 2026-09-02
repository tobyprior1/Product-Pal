# Give the AI assistant real problem-space context

Today the solution-suggestion AI only sees: the opportunity title, its evidence summary, tags, discovery status, the parent outcome title/metric, and the titles of existing sibling solutions. Everything else the product knows about the problem space is invisible to it. Below are the ways we can widen that context, ordered by impact per effort.

## Tier 1 — use context the app already stores (no new UI)

1. **Product / project context.** Send the project name and description, so the model knows the product, audience and domain instead of guessing from one sentence.
2. **Full outcome framing.** Send the outcome description, metric, baseline, current, target and timeframe — not just the title. "Move activation from 22% to 35% this quarter" produces very different solutions than "Improve activation".
3. **Opportunity ancestry.** Walk up the tree and include parent/sub-opportunity chain so a sub-opportunity is understood inside its broader need.
4. **Sibling opportunities.** Include the other opportunities under the same outcome, so suggestions complement rather than duplicate neighbouring work.
5. **Richer existing-solution context.** Send existing solutions with their descriptions and statuses (Now/Next/Done etc.) and any experiments beneath them, including hypothesis, result summary and ship/kill/iterate decision. This lets the AI avoid re-proposing something already killed and build on what was learned.
6. **Notes and links.** Include node notes and evidence links attached to the opportunity — currently ignored entirely.

## Tier 2 — customer evidence

7. **Interview evidence.** Interviews and AI-extracted interview opportunities are already stored per outcome. Pass the relevant verbatim quotes and "why it matters" text for opportunities linked to this node so suggestions are grounded in real customer language rather than the model's priors.
8. **Quote-grounded rationale.** Ask the model to cite which piece of evidence each suggestion responds to, and show that citation in the suggestions dialog. This also makes weak evidence visible to the user.

## Tier 3 — persistent context the user supplies once

9. **Project "Context" settings.** A small form on the project page: product description, target users/segments, business model, tech stack or platform constraints, and things that are off-limits. Stored on the project and injected into every AI call. This is the single biggest quality lever after Tier 1.
10. **Optional per-request steer.** A free-text box in the suggestions dialog ("focus on low-effort ideas", "we can't change pricing") plus a couple of quick toggles (effort level, number of suggestions).

## Tier 4 — quality mechanics

11. **Prompt upgrade.** Restructure the prompt into labelled sections (PRODUCT / OUTCOME / OPPORTUNITY / EVIDENCE / ALREADY TRIED / CONSTRAINTS) rather than one flat list, and require each suggestion to state the assumption it tests.
12. **Context budget.** Truncate and prioritise so large trees and long transcripts don't blow the token budget — nearest ancestors and most recent evidence first.
13. **Reuse everywhere.** Extract a shared `buildTreeContext` helper used by both `suggest-solutions` and `analyze-interview`, so both features benefit and stay consistent.

## Recommended first slice

Tier 1 in full plus item 11 — no schema change, no new UI, and it is where most of the missing signal is. Then Tier 3 item 9 (project context settings), then Tier 2 interview evidence.

## Technical notes

- Context assembly moves into a shared module under `supabase/functions/_shared/` and is called by `suggest-solutions/index.ts`.
- Server-side queries stay RLS-scoped to the caller; the existing client-supplied fallback context is kept for nodes not yet synced and extended with the same richer fields.
- Project context settings (Tier 3) need new nullable text columns on `projects` plus an edit form on the project page.
