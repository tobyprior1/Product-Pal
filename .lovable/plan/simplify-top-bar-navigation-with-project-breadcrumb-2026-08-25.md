# Simplify top-bar navigation with project breadcrumb

## Goal
Make it obvious how to return to the project view while keeping the top bar clean. Implement the selected **Breadcrumb navigation** direction for the editor/tree top bar.

## Current state
- `src/components/Topbar.tsx` always shows a `Product Pal` wordmark that links to `/`.
- The wordmark is the only visual path back, so users inside a tree don't realize they can return to the parent project.
- The toolbar currently mixes a view switcher, canvas actions, toggles, and share/export into three broad clusters.
- `currentTree` (from `useDataStore`) already carries a `projectId` and tree name, so the data needed for the breadcrumb is available.

## Changes

### 1. Add breadcrumb context to the left cluster
In `src/components/Topbar.tsx`:
- When `currentTree` is set:
  - Render the `Product Pal` wordmark with a small left chevron and a hover state that signals "back".
  - Link the wordmark to the current tree's parent project (`/projects/:projectId`) if `projectId` exists, otherwise to `/`.
  - Add a vertical divider.
  - Show the parent project name (or the tree name if unassigned) as a non-clickable label, truncated to avoid overflow.
- When no `currentTree` is set:
  - Keep the `Product Pal` wordmark linking to `/` without the chevron.

### 2. Reorganize the right toolbar cluster
Group the existing controls into logical islands separated by thin vertical dividers:
1. **View switcher** (kept as a dropdown, styled like the selected prototype's "Tree View" button).
2. **History** (undo / redo).
3. **State** (lock / visibility).
4. **Canvas actions** (add node, tidy).
5. **Output actions** (present, export, versions — from the existing Share dropdown, surfaced as individual buttons or kept under a compact menu if space is tight).
6. **Home** icon linking to `/`.

Keep all existing callbacks and tooltips intact.

### 3. Preserve the existing design system
- Use the app's existing shadcn `Button`, `DropdownMenu`, and Tailwind tokens (`bg-background`, `border-border`, `text-muted-foreground`, etc.) rather than the prototype's light/slate theme.
- Keep the rounded-2xl, backdrop-blur, border styling already present in `Topbar`.
- Ensure hover states and focus states match the rest of the app.

### 4. Responsive behavior
- On small screens, hide the breadcrumb label or collapse it into just the chevron + wordmark.
- Keep the toolbar from wrapping by hiding lower-priority actions (e.g., versions, tidy) behind the existing Share dropdown on narrow viewports.

### 5. Validation
- Run `tsgo` (or `bunx tsc --noEmit`) to confirm TypeScript passes.
- Run a build to confirm no errors.
- Use a Playwright check to open the editor and confirm the breadcrumb shows the project/tree name and the chevron back link is present.
