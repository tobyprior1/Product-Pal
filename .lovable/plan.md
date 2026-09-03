# Evals for the AI solution suggestions

A practical eval setup for the "Suggest solutions with AI" feature: a fixed set of test opportunities, automatic scoring, and a results page so you can see whether a prompt or model change made things better or worse.

## What an eval is here

Each eval case is a realistic opportunity brief (product context, outcome + metric, opportunity, evidence, existing solutions, constraints). Running the eval sends every case through the same prompt path the app uses, then scores the returned suggestions two ways:

1. **Rule checks** (deterministic, free)
   - Exactly 5 suggestions, all fields present
   - Title <= 8 words, description 1-2 sentences
   - No near-duplicate of an existing solution in the case
   - No near-duplicate between suggestions
   - Constraint keywords not violated (e.g. case says "can't change pricing")
2. **LLM judge** (Gemini, separate call) scores each suggestion 1-5 on
   - Relevance to the opportunity
   - Specificity (a real thing to build, not a restatement)
   - Testability within ~2 weeks
   - Evidence grounding
   Judge returns per-criterion scores plus a one-line justification.

A run's headline number is: rule pass rate + average judge score, per case and overall.

## User flow

1. Go to `/evals` (linked from nowhere prominent; signed-in users only).
2. See the seeded test set (8-10 cases covering easy/hard, thin evidence, tight constraints, sub-opportunity, "already tried" traps).
3. Click **Run eval** — progress per case, then a scorecard table: case, rule pass/fail, judge average, expandable suggestions with judge comments.
4. Past runs listed with their scores and the model + prompt version used, so you can compare a change against the previous run.
5. Optional thumbs up/down on individual suggestions to build a human-rated baseline you can later compare the judge against.

## Scope

Start with `suggest-solutions`. The same harness is reusable for `analyze-interview` later — the eval tables carry a `feature` column from day one.

## Technical notes

- New tables: `eval_cases` (feature, name, input JSON, notes), `eval_runs` (feature, model, prompt_version, started/finished, aggregate scores), `eval_results` (run_id, case_id, output JSON, rule results JSON, judge scores JSON, latency, human_rating). All owner-scoped RLS with GRANTs.
- New edge function `run-eval`: takes a `runId` + case list, calls the existing suggestion path per case, applies rule checks, then makes a judge call with a strict JSON schema, and writes results. Runs cases sequentially with the same 3.7 → 3.6 → 3.5 fallback and backoff already in place, so Google capacity blips don't fail a whole run.
- Prompt version: extract the system prompt into `_shared/prompts.ts` with an exported `SUGGEST_SOLUTIONS_PROMPT_VERSION` string, recorded on every run so scorecards are attributable.
- Refactor the context builder so an eval case can supply its brief directly (already supported via the fallback context path in `_shared/tree-context.ts`).
- New page `src/pages/Evals.tsx` plus a route; table, run button, expandable per-case detail. No changes to the user-facing suggestion flow.
- Judge uses a cheaper model (`gemini-3.6-flash`) with temperature left at default and a strict output schema, so judge noise stays low.
