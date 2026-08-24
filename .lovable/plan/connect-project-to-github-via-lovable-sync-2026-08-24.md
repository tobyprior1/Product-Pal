# Connect project to GitHub via Lovable sync

Use Lovable's built-in GitHub sync to create a new repository and redirect the project's git remote to it.

### Steps

1. **Open Lovable GitHub sync** — In the Lovable editor, open the Plus (+) menu in the chat input (bottom-left) → GitHub → Connect project.
2. **Authorize the Lovable GitHub App** — Grant access to the GitHub account/organization where the repository should be created.
3. **Create the repository** — Choose the account/org and repository name, then create the repo. Lovable will push the current codebase to it.
4. **Update the local git remote** — Once the repo is created, replace the existing Lovable-managed origin with the new GitHub remote URL.
5. **Verify sync** — Confirm that `git remote -v` shows the GitHub URL and that a test commit or fetch succeeds.

### Things to know
- After connecting, changes made in Lovable will automatically push to GitHub, and changes pushed to GitHub will sync back to Lovable.
- Only one GitHub repository can be linked to this Lovable project at a time.
- Database data is not synced via GitHub; it remains in the connected backend.
