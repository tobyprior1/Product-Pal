# Architecture rules
- Keep one Product Outcome per tree, with at most one optional BusinessOutcome parent; tree names continue to follow the Product Outcome.
- Attach and remove BusinessOutcome parents through owner-authorized atomic database functions so existing product subtrees remain intact.
- Reuse outcome metrics fields and rendering for both outcome types; keep contribution text on the Product Outcome and include it in the shared AI tree brief.
- Top-align cards within each Dagre row using the row's tallest rendered height in editor and presentation layouts so wrapped titles do not stagger siblings.