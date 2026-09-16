ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS business_model text,
  ADD COLUMN IF NOT EXISTS product_stage text,
  ADD COLUMN IF NOT EXISTS competitors text,
  ADD COLUMN IF NOT EXISTS team_scope text,
  ADD COLUMN IF NOT EXISTS team_ways_of_working text;