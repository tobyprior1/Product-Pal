# Richer project fields for better AI suggestions

## Goal
Give the AI solution/experiment generator a fuller picture of each team/project by adding five optional fields to the Create and Edit Project dialogs, stored on the project and injected into every AI brief.

## New fields (all optional)
1. **Business model** — how the product makes money (e.g. subscription, usage-based, marketplace).
2. **Product stage** — idea / MVP / growth / mature (dropdown).
3. **Key metric** — the north-star number the team is judged on.
4. **Competitors / alternatives** — what users would use instead.
5. **Channels** — where users come from (SEO, sales-led, app stores, word of mouth).

## Changes
- **Database**: add nullable columns `business_model`, `product_stage`, `key_metric`, `competitors`, `channels` to `projects` (no RLS change needed — table already owner-scoped).
- **Types & store**: extend `Project` in `src/lib/pm-types.ts`, `dbProjectToProject` mapper, and `createProject`/`updateProject` in `src/lib/store/projects-slice.ts`.
- **Create Project dialog** (`src/pages/Index.tsx`): add the five fields with short helper copy under each; keep the dialog scrollable so it stays usable.
- **Edit Project dialog** (`src/pages/Project.tsx`): same fields, pre-filled.
- **AI context** (`supabase/functions/_shared/tree-context.ts`): include the new fields in the PRODUCT section of the brief so `suggest-solutions` (and any future experiment generator) uses them automatically.
- Redeploy `suggest-solutions`.

## Notes
- Everything stays optional — projects created today keep working unchanged.
- No new UI beyond the dialogs; no change to how suggestions are generated besides richer input.
