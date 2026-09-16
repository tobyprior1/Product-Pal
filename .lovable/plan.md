# Richer project fields for better AI suggestions

## Goal
Give the AI solution/experiment generator a fuller picture of each team/project by adding optional fields to the Create and Edit Project dialogs, grouped into two clear sections: business/product context and team context. All stored on the project and injected into every AI brief.

## Dialog structure (two labelled sections)

### Section 1 — About the product & business
- **Team/Project name** (existing)
- **Purpose of the team/project** (existing)
- **Product context** (existing — what the product does, platform, tech stack)
- **Business model** (new) — how it makes money: subscription, usage-based, marketplace…
- **Product stage** (new, dropdown) — idea / MVP / growth / mature
- **Key metric** (new) — the north-star number the team is judged on
- **Competitors / alternatives** (new) — what users would use instead
- **Target users** (existing) — who you're building for, key segments, jobs to be done
- **Channels** (new) — where users come from: SEO, sales-led, app stores, word of mouth

### Section 2 — About the team
- **Constraints** (existing) — anything off-limits: no pricing changes, compliance rules
- **Team capacity / ways of working** (new) — team size, skills available, release cadence, anything that shapes what's realistic

## Changes
- **Database**: add nullable columns `business_model`, `product_stage`, `key_metric`, `competitors`, `channels`, `team_context` to `projects` (no RLS change — table already owner-scoped).
- **Types & store**: extend `Project` in `src/lib/pm-types.ts`, `dbProjectToProject` mapper, and `createProject`/`updateProject` in `src/lib/store/projects-slice.ts`.
- **Create Project dialog** (`src/pages/Index.tsx`): two sections with headings, new fields, short helper copy under each; dialog stays scrollable.
- **Edit Project dialog** (`src/pages/Project.tsx`): same layout, pre-filled.
- **AI context** (`supabase/functions/_shared/tree-context.ts`): PRODUCT section gains the business fields; a new TEAM section carries constraints + team context so `suggest-solutions` (and future experiment generation) uses them automatically.
- Redeploy `suggest-solutions`.

## Notes
- Everything optional — existing projects keep working unchanged.
- No change to how suggestions are generated besides richer input.
