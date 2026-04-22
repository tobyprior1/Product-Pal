

## Provision a fresh Lovable Cloud backend

Spin up a new Lovable Cloud (Supabase) project and rewire the app to it.

### Steps

1. **Enable Lovable Cloud** — provisions a new Supabase backend and auto-updates `.env` and `src/integrations/supabase/client.ts` with new URL/keys.

2. **Recreate schema via migration** with RLS on all tables:
   - `profiles` + auto-create trigger on `auth.users` insert
   - `trees` (owner = `user_id`)
   - `nodes` (self-referencing `parent_id`, scoped via `tree_id`)
   - `snapshots` (scoped via `tree_id`)
   - `interviews` (owner = `user_id`)
   - `interview_snapshots`, `interview_opportunities`, `interview_insights` (scoped via `interview_id`)
   - Foreign keys, indexes, and `updated_at` triggers as before

3. **Regenerate `src/integrations/supabase/types.ts`** to match the new schema.

4. **Redeploy `analyze-interview` edge function** — code already exists at `supabase/functions/analyze-interview/index.ts`, `verify_jwt = true` kept.

5. **Add `OPENAI_API_KEY` secret** — I'll prompt you for the value after the function is deployed.

6. **Verify** — load the app, sign up, create a tree/node, and confirm the Interviews edge function call succeeds.

### Things to know
- Old data from the dead Supabase project cannot be recovered — clean slate. Share a SQL dump if you have one and I can seed.
- Old auth users won't migrate; sign up again.
- Lovable Cloud has a $25/mo free balance — your usage will comfortably fit.
- OpenAI calls are billed by OpenAI via your key, separate from Lovable.

