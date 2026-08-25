import { supabase } from "@/integrations/supabase/client";
import type { DataSlice, InterviewsSlice } from "./types";

export const createInterviewsSlice: DataSlice<InterviewsSlice> = (set, get) => ({
  addInterview: async (interview) => {
    const userId = get().userId;
    if (!userId) return;

    const { error } = await supabase.from("interviews").insert({
      id: interview.id,
      tree_id: interview.treeId,
      user_id: userId,
      transcript: interview.transcript,
      participant_name: interview.participantName,
      conducted_at: interview.conductedAt,
      video_url: interview.videoUrl,
      status: interview.status,
      uploaded_at: interview.uploadedAt,
      created_by: interview.createdBy,
    });

    if (error) {
      console.error("Error adding interview:", error);
      return;
    }

    set((state) => ({ interviews: [...state.interviews, interview] }));
  },

  updateInterview: async (interviewId, updates) => {
    const { error } = await supabase
      .from("interviews")
      .update({
        participant_name: updates.participantName,
        conducted_at: updates.conductedAt,
        video_url: updates.videoUrl,
        status: updates.status,
      })
      .eq("id", interviewId);

    if (error) {
      console.error("Error updating interview:", error);
      return;
    }

    set((state) => ({
      interviews: state.interviews.map((i) => (i.id === interviewId ? { ...i, ...updates } : i)),
    }));
  },

  deleteInterview: async (interviewId) => {
    const { error } = await supabase.from("interviews").delete().eq("id", interviewId);

    if (error) {
      console.error("Error deleting interview:", error);
      return;
    }

    set((state) => {
      const interviewOpportunities = { ...state.interviewOpportunities };
      delete interviewOpportunities[interviewId];
      return {
        interviews: state.interviews.filter((i) => i.id !== interviewId),
        interviewOpportunities,
      };
    });
  },

  getInterviews: () => get().interviews,

  addInterviewOpportunity: async (interviewId, opportunity) => {
    const { error } = await supabase.from("interview_opportunities").insert({
      id: opportunity.id,
      interview_id: interviewId,
      opportunity_node_id: opportunity.opportunityNodeId,
      title: opportunity.title,
      description: opportunity.description,
      why_it_matters: opportunity.whyItMatters,
      evidence_quote: opportunity.evidenceQuote,
      evidence_ref: opportunity.evidenceRef,
      suggested_next_step: opportunity.suggestedNextStep,
      applied: opportunity.applied,
    });

    if (error) {
      console.error("Error adding interview opportunity:", error);
      return;
    }

    set((state) => ({
      interviewOpportunities: {
        ...state.interviewOpportunities,
        [interviewId]: [...(state.interviewOpportunities[interviewId] || []), opportunity],
      },
    }));
  },

  updateInterviewOpportunity: async (interviewId, opportunityId, updates) => {
    const { error } = await supabase
      .from("interview_opportunities")
      .update({
        applied: updates.applied,
        opportunity_node_id: updates.opportunityNodeId,
      })
      .eq("id", opportunityId);

    if (error) {
      console.error("Error updating interview opportunity:", error);
      return;
    }

    set((state) => ({
      interviewOpportunities: {
        ...state.interviewOpportunities,
        [interviewId]: (state.interviewOpportunities[interviewId] || []).map((opp) =>
          opp.id === opportunityId ? { ...opp, ...updates } : opp
        ),
      },
    }));
  },

  deleteInterviewOpportunity: async (interviewId, opportunityId) => {
    const { error } = await supabase
      .from("interview_opportunities")
      .delete()
      .eq("id", opportunityId);

    if (error) {
      console.error("Error deleting interview opportunity:", error);
      return;
    }

    set((state) => ({
      interviewOpportunities: {
        ...state.interviewOpportunities,
        [interviewId]: (state.interviewOpportunities[interviewId] || []).filter(
          (opp) => opp.id !== opportunityId
        ),
      },
    }));
  },
});
