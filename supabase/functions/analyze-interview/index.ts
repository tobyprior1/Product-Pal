import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpportunityResult {
  title: string;
  description: string;
  why_it_matters: string;
  evidence_quote: string;
  evidence_ref: string;
  suggested_next_step: string;
}

interface InsightResult {
  statement: string;
  evidence_quote: string;
  evidence_ref: string;
  why_it_might_matter: string;
}

interface AnalysisResult {
  participant_name: string;
  quick_facts: string[];
  memorable_quote: {
    quote: string;
    evidence_ref: string;
  };
  opportunities: OpportunityResult[];
  insights: InsightResult[];
  data_quality: {
    coverage_notes: string;
    confidence: "High" | "Medium" | "Low";
    leading_questions?: string[];
  };
}

function parseJsonContent(raw: string): any {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The AI response could not be parsed.");
    return JSON.parse(match[0]);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { interviewId } = await req.json();
    
    if (!interviewId) {
      throw new Error("Interview ID is required");
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client with user's token to respect RLS
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get interview data - RLS will ensure user owns this interview
    const { data: interview, error: fetchError } = await supabaseClient
      .from('interviews')
      .select('*')
      .eq('id', interviewId)
      .maybeSingle();

    if (fetchError) {
      console.error("Database error fetching interview:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!interview) {
      console.error("Interview not found or unauthorized:", interviewId);
      throw new Error("Interview not found or you don't have permission to access it");
    }

    console.log("Found interview:", interview.id, "Status:", interview.status);

    // Create service role client for operations that need elevated privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create initial snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('interview_snapshots')
      .insert({
        interview_id: interviewId,
        status: 'processing',
      })
      .select()
      .single();

    if (snapshotError) {
      console.error("Error creating snapshot:", snapshotError);
      throw new Error("Failed to create snapshot");
    }

    // Update interview status
    await supabase
      .from('interviews')
      .update({ status: 'processing' })
      .eq('id', interviewId);

    try {
      // Call Gemini for analysis
      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      if (!geminiKey) {
        throw new Error("Gemini API key not configured");
      }

      const systemPrompt = `You are an expert product researcher analyzing customer interviews. Extract actionable insights and opportunities from interview transcripts.

Respond with raw JSON only - no markdown, no code fences, no commentary. Your response must be valid JSON matching this exact structure:
{
  "participant_name": "string",
  "quick_facts": ["fact1", "fact2", "fact3"],
  "memorable_quote": {
    "quote": "exact quote from transcript",
    "evidence_ref": "timestamp or line reference"
  },
  "opportunities": [
    {
      "title": "Brief opportunity title",
      "description": "Detailed description",
      "why_it_matters": "Business impact explanation",
      "evidence_quote": "Supporting quote from transcript",
      "evidence_ref": "Timestamp or reference",
      "suggested_next_step": "Actionable next step"
    }
  ],
  "insights": [
    {
      "statement": "Key insight statement",
      "evidence_quote": "Supporting quote",
      "evidence_ref": "Reference",
      "why_it_might_matter": "Why this matters"
    }
  ],
  "data_quality": {
    "coverage_notes": "Assessment of interview quality",
    "confidence": "High" | "Medium" | "Low",
    "leading_questions": ["any leading questions identified"]
  }
}`;

      const callGemini = (model: string) =>
        fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${geminiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Analyze this interview transcript:\n\n${interview.transcript}` }
            ],
          }),
        });

      const modelChain = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let response: Response | undefined;
      outer: for (const model of modelChain) {
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await sleep(600 * attempt);
          response = await callGemini(model);
          if (response.status !== 503 && response.status !== 429) break outer;
          console.warn(`${model} returned ${response.status} (attempt ${attempt + 1})`);
          console.warn(`${model} returned ${response.status} (attempt ${attempt + 1})`);
        }
      }
      response = response!;


      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini error:", errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }


      const data = await response.json();
      const analysis: AnalysisResult = parseJsonContent(data.choices?.[0]?.message?.content ?? "");

      // Store opportunities
      if (analysis.opportunities?.length > 0) {
        const opportunitiesData = analysis.opportunities.map(opp => ({
          interview_id: interviewId,
          title: opp.title,
          description: opp.description,
          why_it_matters: opp.why_it_matters,
          evidence_quote: opp.evidence_quote,
          evidence_ref: opp.evidence_ref,
          suggested_next_step: opp.suggested_next_step,
          applied: false,
        }));

        const { error: oppError } = await supabase
          .from('interview_opportunities')
          .insert(opportunitiesData);

        if (oppError) {
          console.error("Error storing opportunities:", oppError);
        }
      }

      // Store insights
      if (analysis.insights?.length > 0) {
        const insightsData = analysis.insights.map(insight => ({
          interview_id: interviewId,
          statement: insight.statement,
          evidence_quote: insight.evidence_quote,
          evidence_ref: insight.evidence_ref,
          why_it_might_matter: insight.why_it_might_matter,
        }));

        const { error: insightError } = await supabase
          .from('interview_insights')
          .insert(insightsData);

        if (insightError) {
          console.error("Error storing insights:", insightError);
        }
      }

      // Update snapshot with results
      await supabase
        .from('interview_snapshots')
        .update({
          status: 'completed',
          participant_name: analysis.participant_name,
          quick_facts: analysis.quick_facts,
          memorable_quote: analysis.memorable_quote,
          data_quality: analysis.data_quality,
        })
        .eq('id', snapshot.id);

      // Update interview status
      await supabase
        .from('interviews')
        .update({ status: 'analyzed' })
        .eq('id', interviewId);

      return new Response(
        JSON.stringify({ success: true, snapshotId: snapshot.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (analysisError) {
      console.error("Analysis error:", analysisError);
      
      // Update snapshot with error
      await supabase
        .from('interview_snapshots')
        .update({
          status: 'failed',
          error: analysisError instanceof Error ? analysisError.message : 'Unknown error',
        })
        .eq('id', snapshot.id);

      // Update interview status
      await supabase
        .from('interviews')
        .update({ status: 'pending' })
        .eq('id', interviewId);

      throw analysisError;
    }

  } catch (error) {
    console.error("Error in analyze-interview:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});