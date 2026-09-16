# Richer project fields for better AI suggestions

## Goal
Give the AI solution/experiment generator a fuller picture by splitting project setup into two clearly separated groups: **the business/product** (facts about the company and product, the same whoever is asking) and **this team** (what this specific team owns and how it works). Metrics stay where they belong — on each outcome — not on the project.

## Dialog structure

### Step/Section 1 — The business & product
Facts about the product that rarely change.
- **Product context** (existing) — what the product does, platform, tech stack
- **Business model** (new) — how it makes money: subscription, usage-based, marketplace…
- **Product stage** (new, dropdown) — idea / MVP / growth / mature
- **Competitors / alternatives** (new) — what customers would use instead
- **Target users** (existing) — who you're building for, key segments, jobs to be done

### Step/Section 2 — This team
What this particular team owns and how it operates.
- **Team/Project name** (existing)
- **Purpose of the team/project** (existing)
- **Area the team owns** (new) — which part of the product/journey is in scope, and what is explicitly not
- **How the team works** (new) — size, skills available, release cadence — what's realistic to build
- **Constraints** (existing) — anything off-limits: no pricing changes, compliance rules

### Deliberately not here
- **Key metric / target** — belongs on each Outcome, where it already lives (metric, baseline, current, target, timeframe). A team can chase several different metrics, so a single project-level metric would conflict.

## Changes
- **Database**: add nullable columns `business_model`, `product_stage`, `competitors`, `team_scope`, `team_ways_of_working` to `projects` (no RLS change — table is already owner-scoped).
- **Types & store**: extend `Project` in `src/lib/pm-types.ts`, the `dbProjectToProject` mapper, and `createProject`/`updateProject` in `src/lib/store/projects-slice.ts`.
- **Create Project dialog** (`src/pages/Index.tsx`): two headed sections in the order above, with short helper copy under each field; name + purpose stay required-feeling and first within the team section, everything else optional; dialog scrollable.
- **Edit Project dialog** (`src/pages/Project.tsx`): same two sections, pre-filled.
- **AI context** (`supabase/functions/_shared/tree-context.ts`): brief gains two separate sections — `## BUSINESS & PRODUCT` and `## THIS TEAM` (scope, ways of working, constraints) — so suggestions respect both the product reality and what this team can actually ship. OUTCOME section continues to supply the metric.
- Redeploy `suggest-solutions`.

## Notes
- All new fields optional; existing projects keep working unchanged.
- No change to how suggestions are generated beyond richer, better-organised input.
