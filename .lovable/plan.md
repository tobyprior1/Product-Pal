# Relabel project "Description" as purpose

## Change
Rename the Description field in the project dialogs so it clearly asks for the purpose of the team or project, and update the placeholder copy to match.

New copy:
- Label: `Purpose of the team/project`
- Placeholder: `e.g. Make editing fast and reliable for creators`

## Where
- `src/pages/Index.tsx` — Create project dialog (label + placeholder) and Edit project dialog (label + placeholder `Enter project description`).
- `src/pages/Project.tsx` — Edit project dialog (label + placeholder `Enter project description`).

## Notes
Copy-only change. The underlying `description` field, data model, store and AI context stay exactly as they are.
