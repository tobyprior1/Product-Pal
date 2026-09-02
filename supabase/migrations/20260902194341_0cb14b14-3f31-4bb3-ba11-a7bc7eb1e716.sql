ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS product_context text,
  ADD COLUMN IF NOT EXISTS target_users text,
  ADD COLUMN IF NOT EXISTS constraints text;