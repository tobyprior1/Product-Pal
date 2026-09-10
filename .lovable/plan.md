# Compare two AI prompts side by side

Let you run two versions of the solution-suggestion prompt at the same time, see both sets of ideas next to each other, and record which one you preferred.

## How it works for you

1. In Project settings (or a new "AI prompts" screen), you can edit two prompt variants: A and B. Both are saved in the app, so no code change is needed to tweak them.
2. On an opportunity, click "Suggest solutions with AI". A toggle at the top of the dialog switches between **Single** (normal use, uses the winning/active prompt) and **Compare A/B**.
3. In compare mode, the dialog shows two columns of 5 ideas each, generated from the same opportunity context. Which column is A and which is B is hidden by default (blind test) — a "Reveal" link shows it.
4. You pick "Left is better", "Right is better", or "Too close to call". The verdict is saved with the opportunity, the prompt versions used, and both sets of suggestions.
5. You can still tick individual ideas from either column and add them as solutions, exactly as today.
6. A small results strip shows the running tally: "A won 7, B won 3, 2 ties" — so after a handful of comparisons you know which prompt to make the default.

## What is stored

- The two prompt variants, editable in the app, with a version number that bumps on each edit so old verdicts stay attributable to the prompt text that produced them.
- Each comparison: the opportunity, both prompt versions, both suggestion sets, your verdict, and the timestamp.

## Technical notes

- New tables (owner-scoped RLS, GRANTs in the same migration):
  - `ai_prompts` — `id`, `user_id`, `key` (`suggest-solutions`), `label` (`A`/`B`), `system_prompt`, `version`, `is_active`, timestamps.
  - `ai_prompt_comparisons` — `id`, `user_id`, `opportunity_node_id` (nullable), `tree_id`, `prompt_a_id`/`prompt_b_id` + versions, `suggestions_a` jsonb, `suggestions_b` jsonb, `verdict` (`a`/`b`/`tie`), `created_at`.
- `supabase/functions/suggest-solutions/index.ts` gains an optional `variant` / `compare` input:
  - loads the caller's prompt rows from `ai_prompts` (falling back to the current hard-coded prompt when none exist, seeded on first use),
  - in compare mode issues both Gemini calls in parallel via `Promise.all` and returns `{ a: {...}, b: {...} }`, keeping the existing 3.7 → 3.6 → 3.5 retry chain per call,
  - context assembly (`_shared/tree-context.ts`) is unchanged and shared by both calls, so the only difference between the two runs is the system prompt.
- `SolutionSuggestionsDialog.tsx` gets a compare layout (two scrollable columns on desktop, stacked tabs on mobile), blind labelling, verdict buttons that write to `ai_prompt_comparisons`, and keeps the existing steer box and add-selected flow.
- New `src/components/PromptVariantsDialog.tsx` for editing A and B, reachable from the project page; saving bumps `version`.
- Tally read with a simple grouped count query on `ai_prompt_comparisons`.
- Cost note: compare mode makes two model calls per click, so it doubles usage while you are testing; single mode stays one call.
