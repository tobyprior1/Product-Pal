# Architecture rules
- Resolve AI function HTTP errors through the shared client error helper so failed responses retain actionable server messages across all suggestion dialogs.
- Keep one Product Outcome per tree, with optional single BusinessOutcome and ProductNorthStar ancestors ordered BusinessOutcome → ProductNorthStar → Outcome; tree names follow the Product Outcome so adding strategic levels never renames it.
- Attach and remove strategic ancestors through owner-authorized, tree-locked atomic database functions so existing product subtrees remain intact in either attachment order.
- Reuse outcome metrics fields and rendering for all strategic outcome types; keep contribution text on the Product Outcome and include all linked levels in the shared AI tree brief so suggestions retain strategic context.
- Top-align cards within each Dagre row using the row's tallest rendered height in editor and presentation layouts so wrapped titles do not stagger siblings.
- Use the shared theme-aware ProductPalLogo on themeable pages so the wordmark remains readable in both themes; fixed-dark landing pages use the light asset directly.- Interview transcripts and feedback CSVs share one extraction dialog and edge function (source flag); CSVs are parsed client-side and sent as numbered lines so the AI can cluster themes.
