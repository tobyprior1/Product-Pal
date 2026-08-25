# Fix long project name overlapping the toolbar

## What we know

- The `Topbar` in `src/components/Topbar.tsx` shows the project/tree name next to the **Product Pal** brand on the left, followed by a view switcher.
- The editor action pill (Undo/Redo/Node/Tidy) is positioned with `absolute left-1/2 -translate-x-1/2`, so it sits in the middle of the bar regardless of how wide the left section is.
- When the project name is long, the left section can grow wide enough to run underneath the centered action pill, causing the overlap shown in the screenshot.

## Proposed fix

1. **Layout change: true three-column flex bar**
   - Replace the absolute center pill with a flex layout: left group, center group, right group.
   - Left group and right group shrink as needed; center group uses remaining space and centers its actions.
   - This guarantees the action pill can never overlap the left or right content, because it lives inside the same flex row between them.

2. **Truncate the project name gracefully**
   - Keep the existing `truncate` behaviour, but cap the breadcrumb max-width more tightly on small screens.
   - Hide the project name on very small viewports (xs) and show only the Product Pal brand, so the left group never forces the center into an unworkable space.
   - Keep the full name in a `title` tooltip so users can still see it on hover.

3. **Keep the existing design intact**
   - Preserve the breadcrumb, view switcher, action pill styling, lock/visibility controls, Share dropdown, and focus-mode badge.
   - No behaviour changes — only layout and truncation.

## Verification

- TypeScript check passes.
- Build passes.
- Playwright opens `/editor` with a long project name and confirms no overlap at a narrow viewport (≈1024px and below).

## Out of scope

- No changes to the project list or project pages.
- No new topbar features.
