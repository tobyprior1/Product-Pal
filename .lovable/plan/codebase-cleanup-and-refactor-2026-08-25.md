# Codebase Cleanup and Refactor

Yes — this is a sensible moment. The recent feature work (projects layer, outcome rename, draft fields, hierarchy styling, per-action loading) left duplication and one large legacy file behind. The plan below is behaviour-preserving: no visual or functional changes, just structure.

## What gets cleaned up

### 1. Delete dead code
`src/lib/pm-data-store.ts` (453 lines) is a leftover local-only store. Nothing in the app imports it — every page and component now imports `useDataStore` from `pm-supabase-store`. Removing it also removes a second, out-of-date copy of the node/tree logic that could easily be edited by mistake.

### 2. Split the data store (1150 lines)
`pm-supabase-store.ts` currently holds trees, projects, nodes, snapshots/undo, interviews, and all the derived tree queries. Split into focused modules that still compose into the same single `useDataStore` hook, so no call sites change:
- node <-> database mapping helpers
- tree + project persistence
- node persistence
- snapshots / undo / redo
- interviews
- derived selectors (`getNodeChildren`, `getOpportunityStats`, `getRoadmapItems`, etc.) moved to pure functions that take `nodes` — these are the easiest to reason about and test once they no longer live inside the store.

### 3. Share the hierarchy colour system
Outcome/opportunity/solution/experiment colours (purple/amber/blue/teal) are hand-written in `GanttChart.tsx`, `WorkOpportunitySection.tsx` and the node components, with slightly different shades in each. Extract one token/helper module so a single definition drives roadmap, work view and canvas nodes. Colours move into semantic tokens in the design system rather than raw palette classes.

### 4. De-duplicate the dashboard and project pages
`Index.tsx` (551) and `Project.tsx` (522) repeat the same outcome card, empty state, and the `pendingAction` loading pattern. Extract:
- an `OutcomeCard` component
- a small `usePendingAction` hook encapsulating the "only the clicked CTA shows loading, others block clicks without fading" rule

### 5. Trim remaining large components
`FlowEditor.tsx` (528), `Interviews.tsx` (527), `GanttChart.tsx` (392) each mix data wrangling with rendering. Pull their pure computations (row building, grouping, date maths) into `src/lib/` helpers and leave the components as presentation.

## Technical notes
- Public API of `useDataStore` stays identical; imports across the app are unchanged.
- No database migrations, no schema or RLS changes.
- Verification after each step: TypeScript check, production build, and a Playwright pass over dashboard, project, editor, work and roadmap views to confirm nothing changed visually.

## Suggested order
1. Delete `pm-data-store.ts` (safe, immediate win)
2. Hierarchy colour tokens
3. Dashboard/project de-duplication
4. Store split
5. Large-component extraction

Steps 1-3 are low risk and quick; 4 is the biggest change and can be done alone if you'd rather keep the blast radius small.
