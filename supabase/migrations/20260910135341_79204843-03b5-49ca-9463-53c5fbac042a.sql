CREATE TABLE public.ai_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL DEFAULT 'suggest-solutions',
  label TEXT NOT NULL CHECK (label IN ('A','B')),
  system_prompt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, key, label)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompts TO authenticated;
GRANT ALL ON public.ai_prompts TO service_role;

ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ai prompts"
ON public.ai_prompts FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ai_prompts_updated_at
BEFORE UPDATE ON public.ai_prompts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_prompt_comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL DEFAULT 'suggest-solutions',
  opportunity_node_id UUID,
  opportunity_title TEXT,
  tree_id UUID,
  prompt_a_id UUID REFERENCES public.ai_prompts(id) ON DELETE SET NULL,
  prompt_b_id UUID REFERENCES public.ai_prompts(id) ON DELETE SET NULL,
  prompt_a_version INTEGER,
  prompt_b_version INTEGER,
  suggestions_a JSONB,
  suggestions_b JSONB,
  verdict TEXT NOT NULL CHECK (verdict IN ('a','b','tie')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompt_comparisons TO authenticated;
GRANT ALL ON public.ai_prompt_comparisons TO service_role;

ALTER TABLE public.ai_prompt_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ai prompt comparisons"
ON public.ai_prompt_comparisons FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ai_prompt_comparisons_updated_at
BEFORE UPDATE ON public.ai_prompt_comparisons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ai_prompt_comparisons_user ON public.ai_prompt_comparisons(user_id, key, created_at DESC);