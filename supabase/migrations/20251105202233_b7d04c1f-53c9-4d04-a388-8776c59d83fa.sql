-- Create interview_insights table
CREATE TABLE IF NOT EXISTS public.interview_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  evidence_quote TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  why_it_might_matter TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create interview_snapshots table
CREATE TABLE IF NOT EXISTS public.interview_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  participant_name TEXT,
  quick_facts JSONB,
  memorable_quote JSONB,
  data_quality JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.interview_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies for interview_insights
CREATE POLICY "Users can view their own interview insights"
  ON public.interview_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews 
      WHERE interviews.id = interview_insights.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interview insights"
  ON public.interview_insights FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interviews 
      WHERE interviews.id = interview_insights.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

-- RLS policies for interview_snapshots
CREATE POLICY "Users can view their own interview snapshots"
  ON public.interview_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews 
      WHERE interviews.id = interview_snapshots.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interview snapshots"
  ON public.interview_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interviews 
      WHERE interviews.id = interview_snapshots.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interview snapshots"
  ON public.interview_snapshots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews 
      WHERE interviews.id = interview_snapshots.interview_id 
      AND interviews.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_insights_interview_id 
  ON public.interview_insights(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_snapshots_interview_id 
  ON public.interview_snapshots(interview_id);