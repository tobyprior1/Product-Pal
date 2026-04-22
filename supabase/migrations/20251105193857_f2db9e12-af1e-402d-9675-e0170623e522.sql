-- Create trees table
CREATE TABLE public.trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create nodes table
CREATE TABLE public.nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Outcome', 'Opportunity', 'Solution', 'Experiment')),
  title TEXT NOT NULL,
  notes TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create interviews table
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transcript TEXT NOT NULL,
  participant_name TEXT,
  conducted_at TIMESTAMP WITH TIME ZONE,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'analyzed', 'applied')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create interview_opportunities table
CREATE TABLE public.interview_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  opportunity_node_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  evidence_quote TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  suggested_next_step TEXT NOT NULL,
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create snapshots table
CREATE TABLE public.snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID REFERENCES public.trees(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  nodes_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

-- Trees RLS Policies
CREATE POLICY "Users can view own trees"
  ON public.trees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trees"
  ON public.trees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trees"
  ON public.trees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trees"
  ON public.trees FOR DELETE
  USING (auth.uid() = user_id);

-- Nodes RLS Policies
CREATE POLICY "Users can view own nodes"
  ON public.nodes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.trees 
    WHERE trees.id = nodes.tree_id 
    AND trees.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own nodes"
  ON public.nodes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trees 
    WHERE trees.id = nodes.tree_id 
    AND trees.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own nodes"
  ON public.nodes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.trees 
    WHERE trees.id = nodes.tree_id 
    AND trees.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own nodes"
  ON public.nodes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.trees 
    WHERE trees.id = nodes.tree_id 
    AND trees.user_id = auth.uid()
  ));

-- Interviews RLS Policies
CREATE POLICY "Users can view own interviews"
  ON public.interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews"
  ON public.interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews"
  ON public.interviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interviews"
  ON public.interviews FOR DELETE
  USING (auth.uid() = user_id);

-- Interview Opportunities RLS Policies
CREATE POLICY "Users can view own interview opportunities"
  ON public.interview_opportunities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.interviews 
    WHERE interviews.id = interview_opportunities.interview_id 
    AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own interview opportunities"
  ON public.interview_opportunities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.interviews 
    WHERE interviews.id = interview_opportunities.interview_id 
    AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own interview opportunities"
  ON public.interview_opportunities FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.interviews 
    WHERE interviews.id = interview_opportunities.interview_id 
    AND interviews.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own interview opportunities"
  ON public.interview_opportunities FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.interviews 
    WHERE interviews.id = interview_opportunities.interview_id 
    AND interviews.user_id = auth.uid()
  ));

-- Snapshots RLS Policies
CREATE POLICY "Users can view own snapshots"
  ON public.snapshots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.trees 
    WHERE trees.id = snapshots.tree_id 
    AND trees.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own snapshots"
  ON public.snapshots FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trees 
    WHERE trees.id = snapshots.tree_id 
    AND trees.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own snapshots"
  ON public.snapshots FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.trees 
    WHERE trees.id = snapshots.tree_id 
    AND trees.user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_nodes_tree_id ON public.nodes(tree_id);
CREATE INDEX idx_nodes_parent_id ON public.nodes(parent_id);
CREATE INDEX idx_interviews_tree_id ON public.interviews(tree_id);
CREATE INDEX idx_interviews_user_id ON public.interviews(user_id);
CREATE INDEX idx_interview_opportunities_interview_id ON public.interview_opportunities(interview_id);
CREATE INDEX idx_snapshots_tree_id ON public.snapshots(tree_id);

-- Trigger for updated_at on trees
CREATE TRIGGER update_trees_updated_at
  BEFORE UPDATE ON public.trees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updated_at on nodes
CREATE TRIGGER update_nodes_updated_at
  BEFORE UPDATE ON public.nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();