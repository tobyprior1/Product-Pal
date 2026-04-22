import type { OSTNode, Interview, InterviewSnapshot } from "./pm-types"
import { generateUUID, createNodeMetadata } from "./pm-utils"

export function getSeedData(): OSTNode[] {
  const outcomeId = generateUUID()
  const oppBId = generateUUID()
  const oppCId = generateUUID()
  const solB1Id = generateUUID()
  const solB2Id = generateUUID()
  const solC1Id = generateUUID()
  const solC2Id = generateUUID()
  const solC3Id = generateUUID()

  return [
    // Outcome (root)
    {
      id: outcomeId,
      parentId: null,
      type: "Outcome",
      title: "Creative Order Share",
      metric: "Creative Order Share",
      baseline: 33,
      current: 42,
      target: 50,
      timeframePeriodType: "half",
      timeframePeriodValue: "H2 FY2025",
      ...createNodeMetadata(),
    },

    // Opportunity B
    {
      id: oppBId,
      parentId: outcomeId,
      type: "Opportunity",
      title: "I'm unable to find the right sticker",
      status: "backlog",
      reach: 5,
      confidence: 6,
      impact: 2,
      ...createNodeMetadata(),
    },

    // Solution B1
    {
      id: solB1Id,
      parentId: oppBId,
      type: "Solution",
      title: "Allow users to search for stickers",
      status: "Backlog",
      ...createNodeMetadata(),
    },

    // Experiment B1-1
    {
      id: generateUUID(),
      parentId: solB1Id,
      type: "Experiment",
      title: "Add a search bar to the top of the modal",
      hypothesis: "Search functionality reduces friction in sticker discovery",
      method: "Add search input with real-time filtering",
      status: "planned",
      dateRange: { start: "2025-09-15", end: "2025-09-29" },
      metricImpacts: [{ metric: "Creative Order Share", before: 33, after: 37 }],
      ...createNodeMetadata(),
    },

    // Solution B2
    {
      id: solB2Id,
      parentId: oppBId,
      type: "Solution",
      title: "Allow users to filter through categories of stickers",
      status: "Backlog",
      ...createNodeMetadata(),
    },

    // Experiment B2-1
    {
      id: generateUUID(),
      parentId: solB2Id,
      type: "Experiment",
      title: "Hard-code filters on the stickers modal",
      hypothesis: "Category filters help users narrow down options quickly",
      method: "Implement category tabs with filtering logic",
      status: "completed",
      decision: "kill",
      dateRange: { start: "2025-10-01" },
      metricImpacts: [{ metric: "Creative Order Share", before: 33, after: 36 }],
      ...createNodeMetadata(),
    },

    // Opportunity C
    {
      id: oppCId,
      parentId: outcomeId,
      type: "Opportunity",
      title: "I wasn't aware of the features V2",
      status: "in-discovery",
      reach: 7,
      confidence: 8,
      impact: 7,
      ...createNodeMetadata(),
    },

    // Solution C1
    {
      id: solC1Id,
      parentId: oppCId,
      type: "Solution",
      title: "Add sticker placeholder to the inside of the card",
      status: "Done",
      releaseStatus: "released",
      startDate: "2025-01-05",
      endDate: "2025-06-30",
      ...createNodeMetadata(),
    },

    // Experiment C1-1
    {
      id: generateUUID(),
      parentId: solC1Id,
      type: "Experiment",
      title: "Add sticker placeholder",
      hypothesis: "Adding a placeholder will increase sticker usage",
      method: "A/B test with placeholder vs control",
      status: "completed",
      decision: "ship",
      confidence: "high",
      dateRange: { start: "2025-01-05", end: "2025-05-14" },
      resultSummary: "Placeholder increased sticker discovery and usage significantly.",
      metricImpacts: [{ metric: "Creative Order Share", before: 33, after: 38 }],
      ...createNodeMetadata(),
    },

    // Experiment C1-2
    {
      id: generateUUID(),
      parentId: solC1Id,
      type: "Experiment",
      title: "Make sticker placeholder bigger",
      hypothesis: "Larger placeholder will be more noticeable and increase engagement",
      method: "Increase placeholder size by 50%",
      status: "completed",
      decision: "ship",
      confidence: "high",
      dateRange: { start: "2025-06-02", end: "2025-06-16" },
      resultSummary: "Bigger placeholder improved visibility and click-through rate.",
      metricImpacts: [{ metric: "Creative Order Share", before: 38, after: 42 }],
      ...createNodeMetadata(),
    },

    // Experiment C1-3
    {
      id: generateUUID(),
      parentId: solC1Id,
      type: "Experiment",
      title: "Make sticker placeholder a visual of a sticker",
      hypothesis: "Visual representation will better communicate the feature",
      method: "Replace text placeholder with sticker icon",
      status: "completed",
      decision: "ship",
      confidence: "high",
      dateRange: { start: "2025-06-20", end: "2025-06-30" },
      resultSummary: "Visual placeholder increased user understanding and engagement.",
      metricImpacts: [{ metric: "Creative Order Share", before: 42, after: 45 }],
      ...createNodeMetadata(),
    },

    // Solution C2
    {
      id: solC2Id,
      parentId: oppCId,
      type: "Solution",
      title: "Add photo placeholder to the card",
      status: "Now",
      startDate: "2025-10-07",
      endDate: "2025-10-31",
      ...createNodeMetadata(),
    },

    // Experiment C2-1
    {
      id: generateUUID(),
      parentId: solC2Id,
      type: "Experiment",
      title: "Client side photo placeholder in the inside left",
      hypothesis: "Photo placeholder on client side will increase photo usage",
      method: "Add photo placeholder to left side of card interior",
      status: "running",
      dateRange: { start: "2025-10-07", end: "2025-10-24" },
      ...createNodeMetadata(),
    },

    // Experiment C2-2
    {
      id: generateUUID(),
      parentId: solC2Id,
      type: "Experiment",
      title: "Add photo placeholders to the service",
      hypothesis: "Service-level photo placeholders will improve photo feature adoption",
      method: "Implement photo placeholders in backend service",
      status: "planned",
      dateRange: { start: "2025-10-27", end: "2025-10-31" },
      ...createNodeMetadata(),
    },

    // Solution C3
    {
      id: solC3Id,
      parentId: oppCId,
      type: "Solution",
      title: "Show a sticker banner to drive adoption",
      status: "Done",
      releaseStatus: "released",
      startDate: "2024-06-18",
      endDate: "2025-03-27",
      ...createNodeMetadata(),
    },

    // Experiment C3-1
    {
      id: generateUUID(),
      parentId: solC3Id,
      type: "Experiment",
      title: "Show a sticker banner when a user opens the card",
      hypothesis: "Banner on card open will increase sticker awareness",
      method: "Display banner on card open event",
      status: "completed",
      decision: "ship",
      confidence: "high",
      dateRange: { start: "2024-06-18", end: "2024-07-07" },
      resultSummary: "Banner successfully increased sticker feature awareness and usage.",
      metricImpacts: [{ metric: "Creative Order Share", before: 33, after: 36 }],
      ...createNodeMetadata(),
    },

    // Experiment C3-2
    {
      id: generateUUID(),
      parentId: solC3Id,
      type: "Experiment",
      title: "Show a discount promotion in sticker banner",
      hypothesis: "Discount promotion will incentivize sticker usage",
      method: "Add promotional discount messaging to banner",
      status: "completed",
      decision: "kill",
      confidence: "medium",
      dateRange: { start: "2024-07-08", end: "2024-08-12" },
      resultSummary: "Discount messaging did not significantly impact adoption; killed experiment.",
      metricImpacts: [{ metric: "Creative Order Share", before: 36, after: 35 }],
      ...createNodeMetadata(),
    },

    // Experiment C3-3
    {
      id: generateUUID(),
      parentId: solC3Id,
      type: "Experiment",
      title: "Change trigger point of sticker banner",
      hypothesis: "Different trigger timing will improve banner effectiveness",
      method: "Adjust banner trigger to different user action point",
      status: "completed",
      decision: "ship",
      confidence: "high",
      dateRange: { start: "2025-03-12", end: "2025-03-20" },
      resultSummary: "New trigger point improved banner relevance and engagement.",
      metricImpacts: [{ metric: "Creative Order Share", before: 35, after: 40 }],
      ...createNodeMetadata(),
    },

    // Experiment C3-4
    {
      id: generateUUID(),
      parentId: solC3Id,
      type: "Experiment",
      title: "Change copy of sticker banner",
      hypothesis: "Improved copy will increase click-through and engagement",
      method: "A/B test new banner messaging",
      status: "completed",
      decision: "ship",
      confidence: "high",
      dateRange: { start: "2025-03-20", end: "2025-03-27" },
      resultSummary: "New copy increased user engagement and sticker adoption.",
      metricImpacts: [{ metric: "Creative Order Share", before: 40, after: 42 }],
      ...createNodeMetadata(),
    },
  ]
}

export function getSeedInterviews(treeId: string): {
  interviews: Interview[]
  opportunities: any[]
} {
  const interviewId = generateUUID()

  const interviews: Interview[] = [
    {
      id: interviewId,
      treeId,
      participantName: "Jess",
      transcript: `[00:00] R (Researcher): Thanks for joining, Jess. I'll ask you to think aloud while you make a birthday card in the editor. Ready? [00:03] C (Customer): Yep, let's go. I've got about 20 minutes before I need to run. [00:07] R: Great. Start however you normally would. [00:10] C: I'm on the site… search bar… I'll type "Dad 60 funny." (pause) Okay, I see results. I'm scrolling. [00:21] R: What are you looking for? [00:23] C: Something that feels right. Like, funny but not mean. My dad's turning 60, so I want it to be… you know, celebratory but also a bit cheeky. [00:35] R: Got it. [00:37] C: (clicks a card) This one's okay. I'll open it. [00:42] R: What do you think? [00:44] C: It's fine. The layout is good. But I want to add a photo of him. Where do I… (pause) I don't see a photo button. [00:55] R: What would you expect? [00:57] C: Like, a placeholder or something that says "Add Photo Here." I'm looking around… nothing obvious. [01:08] R: What are you doing now? [01:10] C: I'm clicking around to see if there's a hidden menu or something. (pause) Nope. I guess I'll just skip the photo. [01:20] R: How does that feel? [01:22] C: A bit disappointing. I wanted to make it more personal. But I don't have time to figure it out. [01:30] R: Okay. What's next? [01:32] C: I'll add a sticker. That's fun. (pause) Wait, where are the stickers? [01:38] R: What are you seeing? [01:40] C: I see the text editor, but no sticker button. I thought there'd be one. [01:48] R: What would help? [01:50] C: Maybe a little icon or a section that says "Add Stickers" or "Decorations." Something visual. [02:00] R: Got it. [02:02] C: (scrolls) Oh wait, I see it now. It's at the bottom. I didn't notice it before. [02:10] R: Why do you think that is? [02:12] C: It's small. And I was focused on the text area. I wasn't looking down there. [02:20] R: What happens when you click it? [02:22] C: (clicks) Okay, a modal opens. Lots of stickers. That's good. But… (pause) there's so many. I don't know where to start. [02:35] R: What would make this easier? [02:37] C: Categories maybe? Like "Birthday," "Funny," "Animals." Or a search bar. [02:45] R: Anything else? [02:47] C: Yeah, on mobile, I want fewer choices but smarter ones. Like, show me the most popular or the ones that match my card. [03:00] R: That's helpful. [03:02] C: (selects a sticker) Okay, I found one. But now I need to center it. The face is the whole point of the sticker, and it's off to the side. [03:15] R: What would you do? [03:17] C: I'd want a button that says "Center Face" or something. Like, a quick fix. [03:25] R: Got it. [03:27] C: (adjusts manually) Okay, it's close enough. I'm done. [03:32] R: How was that overall? [03:34] C: It's a good tool. But I felt like I was hunting for things. The photo thing was frustrating. And the stickers… I found them, but it took longer than I wanted. [03:50] R: What would make it better? [03:52] C: More obvious buttons. Placeholders for photos and stickers. And maybe some guidance, like "Try adding a photo!" or something. [04:05] R: Thanks, Jess. This is really helpful. [04:07] C: No problem. Hope it helps!`,
      conductedAt: "2025-10-25",
      uploadedAt: new Date().toISOString(),
      status: "analyzed",
      createdBy: null,
      videoUrl: null,
    },
  ]

  const opportunities = [
    {
      interview_id: interviewId,
      title: "I need an easy way to center faces in cut-out designs",
      description: "A quick 'make face centered' button would help when the face is the whole point of my design.",
      why_it_matters:
        "Users want to personalize cards with photos but struggle with precise positioning, leading to frustration and abandoned customization attempts.",
      evidence_quote: "A quick 'make face centered' button? Or like, 'smart crop.' Dad's face is the whole point.",
      evidence_ref: "[03:17]",
      suggested_next_step:
        "Prototype an AI-powered face detection feature that automatically centers faces in photo uploads, then test with 10 users creating photo cards.",
      applied: false,
    },
    {
      interview_id: interviewId,
      title: "I want auto-saving clarity and reassurance",
      description:
        "It's unclear if my work is saved automatically; I need confirmation like a clear 'autosaved recently' message.",
      why_it_matters:
        "Lack of save status visibility creates anxiety and may cause users to lose work or waste time manually saving unnecessarily.",
      evidence_quote: "It says 'Your design is saved,' but I don't totally trust it.",
      evidence_ref: "[01:22]",
      suggested_next_step:
        "Add a persistent save status indicator with timestamp (e.g., 'Saved 2 seconds ago') and test if it reduces user anxiety and support tickets.",
      applied: false,
    },
    {
      interview_id: interviewId,
      title: "I want a way to find or create custom stickers",
      description:
        "Tags like 'hobbies,' 'fishing,' or the ability to turn a photo into a sticker would be helpful.",
      why_it_matters:
        "Users want highly personalized cards but are limited by the available sticker library, reducing engagement with the sticker feature.",
      evidence_quote: "Tags like 'hobbies,' 'fishing,' or a way to turn a photo into a little sticker.",
      evidence_ref: "[02:37]",
      suggested_next_step:
        "Explore feasibility of user-generated stickers or photo-to-sticker conversion, starting with a small beta test group.",
      applied: false,
    },
    {
      interview_id: interviewId,
      title: "I wasn't aware of the photo and sticker features",
      description:
        "More obvious buttons and placeholders for photos and stickers would help me discover these features faster.",
      why_it_matters:
        "Hidden or unclear UI elements prevent users from discovering key personalization features, reducing card customization and satisfaction.",
      evidence_quote:
        "More obvious buttons. Placeholders for photos and stickers. And maybe some guidance, like 'Try adding a photo!'",
      evidence_ref: "[03:52]",
      suggested_next_step:
        "Add visual placeholders and tooltips for photo/sticker features, then measure feature discovery rates and usage in A/B test.",
      applied: false,
    },
  ]

  return { interviews, opportunities }
}
