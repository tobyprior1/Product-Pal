# Add a "Planned" status to Solutions

Goal: let a user schedule a solution on the delivery timeline without committing it to Now, Next or Later.

## Behaviour

- New solution status: **Planned**, selectable in the solution details panel alongside Now / Next / Later / Done / Backlog.
- **Date Delivery (timeline) view**: Planned solutions appear like any other dated solution — as long as they have a start date — with their own distinct bar colour and a "Planned" badge in the left-hand row list.
- **Now, Next, Later view**: no Planned column. Planned solutions simply don't appear on that board, the same way Backlog items don't.
- Tree/canvas node card: shows a "Planned" badge with its own colour so the status is visible in the editor.
- Existing solutions are untouched; nothing is migrated or renamed.

On the naming concern: keeping Planned as a timeline-only status makes the distinction clean — Now/Next/Later are commitment buckets on the board, Planned means "scheduled with dates but not yet committed", Backlog means "not scheduled at all".

## Technical notes

- `src/lib/pm-types.ts`: add `"Planned"` to `SolutionStatus`.
- `src/components/node-fields/SolutionFields.tsx`: add the Planned option to the status select.
- `src/components/GanttChart.tsx`: `getSolutionColor()` returns a distinct colour (purple) for Planned. The existing row filter (`startDate && status !== "Done" && status !== "Backlog"`) already includes Planned, so no filter change is needed.
- `src/components/nodes/SolutionNode.tsx`: add a Planned case to `getStatusColor()`.
- `src/lib/pm-utils.ts`: add Planned entries to the status background/border colour maps (note the maps currently key lowercase `planned` for experiments; add the capitalised solution key).
- `src/components/WorkOpportunitySection.tsx`: give Planned a sort priority between Later and Backlog.
- `src/lib/pm-supabase-store.ts` and `pm-data-store.ts`: leave `getBacklogItems` as-is; Planned is not backlog. Confirm the roadmap-count helper treats Planned as in-progress work (it excludes only Done and Backlog, so it already does).
- `src/pages/Roadmap.tsx`: no change — it filters explicitly for Now/Next/Later.
- Status is stored inside the node `data` JSON column, so no database migration is required.
