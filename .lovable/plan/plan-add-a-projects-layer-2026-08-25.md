# Plan: Add a Projects layer

## Goal
Give the home page an intermediate "Projects" step so users pick a project first, then see the trees inside it. Existing trees remain usable.

## Scope
- Projects are **grouping-only** — interviews, roadmap and work stay tied to each tree as today.
- Existing trees remain **unassigned** and show on the home page in an "Unassigned" section.
- Home page shows a **projects list**; clicking a project opens a project page listing its trees.

## Database changes
1. Add `public.projects` table:
   - `id uuid primary key default gen_random_uuid()`
   - `user_id uuid references auth.users(id) on delete cascade`
   - `name text not null`
   - `description text`
   - `created_at / updated_at timestamps`
   - GRANTs, RLS, policies: owners can CRUD their own projects.
2. Add `project_id uuid references public.projects(id) on delete set null` to `public.trees`.
3. Update RLS on `trees` so users can still read/update/delete their own trees, and assign/unassign a project.

## Back-end / store changes
1. Add project methods to `pm-supabase-store.ts`:
   - `loadProjects()`
   - `createProject(name, description)`
   - `updateProject(id, updates)`
   - `deleteProject(id)`
   - `assignTreeToProject(treeId, projectId)`
2. Update `loadUserData` to also fetch projects.
3. Update `createNewTree(name, projectId?)` to optionally set a project.

## UI changes
1. `src/pages/Index.tsx`:
   - Show "Projects" section with project cards (create, rename, delete).
   - Show "Unassigned trees" section with existing trees.
   - Add ability to move an unassigned tree into a project.
2. New `src/pages/Project.tsx`:
   - Show project name/description.
   - List trees in the project.
   - Allow creating a new tree inside this project.
   - Allow renaming/deleting trees as today.
   - Allow moving a tree back to "Unassigned".
3. Add route `/projects/:id` in `src/App.tsx`.

## Migration
- Leave existing `trees.project_id` as `null` so they remain unassigned.
- No data loss for trees, nodes, snapshots, interviews, etc.

## Verification
- Build passes.
- Home page lists projects and unassigned trees.
- Creating a project, creating a tree inside it, and moving trees works end-to-end.
- Existing trees remain accessible.
