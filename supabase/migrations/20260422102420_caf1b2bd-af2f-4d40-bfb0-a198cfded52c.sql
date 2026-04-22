
-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- trees
CREATE TABLE public.trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_trees_user_id ON public.trees(user_id);
CREATE POLICY "Users view own trees" ON public.trees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own trees" ON public.trees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own trees" ON public.trees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own trees" ON public.trees FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_trees_updated_at BEFORE UPDATE ON public.trees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- nodes
CREATE TABLE public.nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  data JSONB,
  links JSONB,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_nodes_tree_id ON public.nodes(tree_id);
CREATE INDEX idx_nodes_parent_id ON public.nodes(parent_id);
CREATE POLICY "Users view nodes in own trees" ON public.nodes FOR SELECT USING (EXISTS (SELECT 1 FROM public.trees t WHERE t.id = nodes.tree_id AND t.user_id = auth.uid()));
CREATE POLICY "Users insert nodes in own trees" ON public.nodes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.trees t WHERE t.id = nodes.tree_id AND t.user_id = auth.uid()));
CREATE POLICY "Users update nodes in own trees" ON public.nodes FOR UPDATE USING (EXISTS (SELECT 1 FROM public.trees t WHERE t.id = nodes.tree_id AND t.user_id = auth.uid()));
CREATE POLICY "Users delete nodes in own trees" ON public.nodes FOR DELETE USING (EXISTS (SELECT 1 FROM public.trees t WHERE t.id = nodes.tree_id AND t.user_id = auth.uid()));
CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON public.nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- snapshots
CREATE TABLE public.snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  nodes_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_snapshots_tree_id ON public.snapshots(tree_id);
CREATE POLICY "Users view snapshots in own trees" ON public.snapshots FOR SELECT USING (EXISTS (SELECT 1 FROM public.trees t WHERE t.id = snapshots.tree_id AND t.user_id = auth.uid()));
CREATE POLICY "Users insert snapshots in own trees" ON public.snapshots FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.trees t WHERE t.id = snapshots.tree_id AND t.user_id = auth.uid()));
CREATE POLICY "Users delete snapshots in own trees" ON public.snapshots FOR DELETE USING (EXISTS (SELECT 1 FROM public.trees t WHERE t.id = snapshots.tree_id AND t.user_id = auth.uid()));

-- interviews
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  participant_name TEXT,
  transcript TEXT NOT NULL,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  conducted_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_interviews_user_id ON public.interviews(user_id);
CREATE INDEX idx_interviews_tree_id ON public.interviews(tree_id);
CREATE POLICY "Users view own interviews" ON public.interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own interviews" ON public.interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own interviews" ON public.interviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own interviews" ON public.interviews FOR DELETE USING (auth.uid() = user_id);

-- interview_snapshots
CREATE TABLE public.interview_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'processing',
  participant_name TEXT,
  quick_facts JSONB,
  memorable_quote JSONB,
  data_quality JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interview_snapshots ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_interview_snapshots_interview_id ON public.interview_snapshots(interview_id);
CREATE POLICY "Users view snapshots of own interviews" ON public.interview_snapshots FOR SELECT USING (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_snapshots.interview_id AND i.user_id = auth.uid()));
CREATE POLICY "Users insert snapshots for own interviews" ON public.interview_snapshots FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_snapshots.interview_id AND i.user_id = auth.uid()));
CREATE POLICY "Users update snapshots of own interviews" ON public.interview_snapshots FOR UPDATE USING (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_snapshots.interview_id AND i.user_id = auth.uid()));

-- interview_opportunities
CREATE TABLE public.interview_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  opportunity_node_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  evidence_quote TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  suggested_next_step TEXT NOT NULL,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interview_opportunities ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_interview_opportunities_interview_id ON public.interview_opportunities(interview_id);
CREATE POLICY "Users view opps of own interviews" ON public.interview_opportunities FOR SELECT USING (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_opportunities.interview_id AND i.user_id = auth.uid()));
CREATE POLICY "Users insert opps for own interviews" ON public.interview_opportunities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_opportunities.interview_id AND i.user_id = auth.uid()));
CREATE POLICY "Users update opps of own interviews" ON public.interview_opportunities FOR UPDATE USING (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_opportunities.interview_id AND i.user_id = auth.uid()));
CREATE POLICY "Users delete opps of own interviews" ON public.interview_opportunities FOR DELETE USING (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_opportunities.interview_id AND i.user_id = auth.uid()));

-- interview_insights
CREATE TABLE public.interview_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  evidence_quote TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  why_it_might_matter TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.interview_insights ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_interview_insights_interview_id ON public.interview_insights(interview_id);
CREATE POLICY "Users view insights of own interviews" ON public.interview_insights FOR SELECT USING (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_insights.interview_id AND i.user_id = auth.uid()));
CREATE POLICY "Users insert insights for own interviews" ON public.interview_insights FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_insights.interview_id AND i.user_id = auth.uid()));
CREATE POLICY "Users delete insights of own interviews" ON public.interview_insights FOR DELETE USING (EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_insights.interview_id AND i.user_id = auth.uid()));
