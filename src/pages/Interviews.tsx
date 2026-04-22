import { useState, useMemo, useEffect } from "react"
import { useDataStore } from "@/lib/pm-supabase-store"
import { Topbar } from "@/components/Topbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion } from "@/components/ui/accordion"
import { FileText, Upload, Search, SortAsc } from "lucide-react"
import { generateUUID, createTimestamp } from "@/lib/pm-utils"
import type { Interview, InterviewSnapshot } from "@/lib/pm-types"
import { useToast } from "@/hooks/use-toast"
import { InterviewCard } from "@/components/interviews/InterviewCard"
import { InterviewUploadDialog } from "@/components/interviews/InterviewUploadDialog"
import { InterviewTranscriptDialog } from "@/components/interviews/InterviewTranscriptDialog"
import { InterviewLoadingState } from "@/components/interviews/InterviewLoadingState"
import { supabase } from "@/integrations/supabase/client"

const Interviews = () => {
  const interviews = useDataStore((state) => state.getInterviews())
  const addInterview = useDataStore((state) => state.addInterview)
  const updateInterview = useDataStore((state) => state.updateInterview)
  const deleteInterview = useDataStore((state) => state.deleteInterview)
  const getInterviewOpportunities = useDataStore((state) => state.getInterviewOpportunities)
  const currentTree = useDataStore((state) => state.currentTree)
  const { toast } = useToast()

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [transcriptDialogOpen, setTranscriptDialogOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "name" | "status">("date")
  const [snapshots, setSnapshots] = useState<Record<string, InterviewSnapshot>>({})

  // Load interview snapshots
  useEffect(() => {
    const loadSnapshots = async () => {
      if (interviews.length === 0) return
      
      const interviewIds = interviews.map(i => i.id)
      
      // Load snapshots
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('interview_snapshots')
        .select('*')
        .in('interview_id', interviewIds)
      
      if (snapshotError) {
        console.error("Error loading snapshots:", snapshotError)
        return
      }

      // Load opportunities
      const { data: opportunitiesData } = await supabase
        .from('interview_opportunities')
        .select('*')
        .in('interview_id', interviewIds)
      
      // Load insights
      const { data: insightsData } = await supabase
        .from('interview_insights')
        .select('*')
        .in('interview_id', interviewIds)
      
      // Combine into snapshot map
      const snapshotMap: Record<string, InterviewSnapshot> = {}
      
      snapshotData?.forEach((snapshot: any) => {
        const opportunities = (opportunitiesData || [])
          .filter((opp: any) => opp.interview_id === snapshot.interview_id)
          .map((opp: any) => ({
            id: opp.id,
            interviewId: opp.interview_id,
            opportunityNodeId: opp.opportunity_node_id,
            title: opp.title,
            description: opp.description,
            whyItMatters: opp.why_it_matters,
            evidenceQuote: opp.evidence_quote,
            evidenceRef: opp.evidence_ref,
            suggestedNextStep: opp.suggested_next_step,
            createdAt: opp.created_at,
            applied: opp.applied,
          }))

        const insights = (insightsData || [])
          .filter((insight: any) => insight.interview_id === snapshot.interview_id)
          .map((insight: any) => ({
            id: insight.id,
            interviewId: insight.interview_id,
            statement: insight.statement,
            evidence_quote: insight.evidence_quote,
            evidence_ref: insight.evidence_ref,
            why_it_might_matter: insight.why_it_might_matter,
          }))

        snapshotMap[snapshot.interview_id] = {
          id: snapshot.id,
          interviewId: snapshot.interview_id,
          createdAt: snapshot.created_at,
          status: snapshot.status,
          participant_name: snapshot.participant_name,
          quick_facts: snapshot.quick_facts || [],
          memorable_quote: snapshot.memorable_quote,
          opportunities,
          insights,
          data_quality: snapshot.data_quality,
          error: snapshot.error,
        }
      })
      
      setSnapshots(snapshotMap)
    }

    loadSnapshots()

    // Set up realtime subscription
    const channel = supabase
      .channel('interview-snapshots')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_snapshots'
        },
        () => {
          loadSnapshots()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_opportunities'
        },
        () => {
          loadSnapshots()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_insights'
        },
        () => {
          loadSnapshots()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'interviews'
        },
        () => {
          // Reload interviews when status changes
          if (currentTree) {
            useDataStore.getState().loadUserData()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [interviews, currentTree])

  const filteredAndSortedInterviews = useMemo(() => {
    let filtered = interviews

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (interview) =>
          interview.participantName?.toLowerCase().includes(query) ||
          interview.transcript.toLowerCase().includes(query)
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        case "name":
          return (a.participantName || "").localeCompare(b.participantName || "")
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    return sorted
  }, [interviews, searchQuery, sortBy])

  const handleUploadInterview = async (data: {
    participantName?: string
    conductedAt?: string
    videoUrl?: string
    transcript: string
  }) => {
    if (!data.transcript.trim()) {
      toast({
        title: "Missing transcript",
        description: "Please enter an interview transcript",
        variant: "destructive",
      })
      return
    }

    if (!currentTree) {
      toast({
        title: "No tree found",
        description: "Please create a tree first",
        variant: "destructive",
      })
      return
    }

    // Check if this is a demo tree (not saved to database)
    if (currentTree.name.includes("(Demo)")) {
      toast({
        title: "Demo Tree",
        description: "Please create a real tree to upload interviews. Demo trees are not saved.",
        variant: "destructive",
      })
      return
    }

    if (editingInterview) {
      // Update existing interview
      await updateInterview(editingInterview.id, {
        participantName: data.participantName?.trim() || undefined,
        conductedAt: data.conductedAt || undefined,
        videoUrl: data.videoUrl?.trim() || undefined,
        transcript: data.transcript.trim(),
      })

      toast({
        title: "Interview updated",
        description: "Your changes have been saved",
      })
    } else {
      // Create new interview
      const newInterview: Interview = {
        id: generateUUID(),
        treeId: currentTree.id,
        transcript: data.transcript.trim(),
        participantName: data.participantName?.trim() || undefined,
        conductedAt: data.conductedAt || undefined,
        videoUrl: data.videoUrl?.trim() || undefined,
        uploadedAt: createTimestamp(),
        status: "pending",
      }

      await addInterview(newInterview)

      // Close dialog immediately
      setUploadDialogOpen(false)
      setEditingInterview(null)

      // Small delay to ensure DB write completes
      await new Promise(resolve => setTimeout(resolve, 500))

      toast({
        title: "Interview uploaded",
        description: "AI analysis in progress...",
      })

      // Trigger AI analysis
      try {
        const { error: analyzeError } = await supabase.functions.invoke('analyze-interview', {
          body: { interviewId: newInterview.id }
        })

        if (analyzeError) {
          throw analyzeError
        }
      } catch (analyzeError) {
        console.error("Error analyzing interview:", analyzeError)
        toast({
          title: "Analysis Failed",
          description: "Interview uploaded but analysis failed. You can retry later.",
          variant: "destructive",
        })
      }
      return
    }

    setUploadDialogOpen(false)
    setEditingInterview(null)
  }

  const handleDeleteInterview = (interviewId: string) => {
    deleteInterview(interviewId)
    toast({
      title: "Interview deleted",
      description: "The interview has been removed from your library",
    })
  }

  const handleEditInterview = (interview: Interview) => {
    setEditingInterview(interview)
    setUploadDialogOpen(true)
  }

  const handleViewTranscript = (interviewId: string) => {
    const interview = interviews.find(i => i.id === interviewId)
    setSelectedInterview(interview || null)
    setTranscriptDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setUploadDialogOpen(open)
    if (!open) {
      setEditingInterview(null)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Topbar />

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Interview Library</h1>
              <p className="text-muted-foreground mt-1">
                Store and analyze customer interview transcripts
              </p>
            </div>

            <Button onClick={() => setUploadDialogOpen(true)} className="gap-2" disabled={currentTree?.name.includes("(Demo)")}>
              <Upload className="w-4 h-4" />
              Upload Interview
            </Button>
          </div>

          {currentTree?.name.includes("(Demo)") && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-3">
                📝 <strong>Demo Mode:</strong> Create a real tree to upload and analyze interviews. The demo tree is view-only.
              </p>
              <Button 
                onClick={async () => {
                  const treeId = await useDataStore.getState().createNewTree("My Opportunity Tree")
                  toast({
                    title: "Tree Created",
                    description: "You can now upload interviews for AI analysis",
                  })
                }}
                variant="outline"
                size="sm"
              >
                Create New Tree
              </Button>
            </div>
          )}

          {interviews.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search interviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {filteredAndSortedInterviews.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {interviews.length === 0 ? "No interviews yet" : "No matching interviews"}
                  </h2>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {interviews.length === 0
                      ? "Upload interview transcripts to start building insights and opportunities."
                      : "Try adjusting your search query or filters."}
                  </p>
                </div>
                {interviews.length === 0 && !currentTree?.name.includes("(Demo)") && (
                  <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Your First Interview
                  </Button>
                )}
                {interviews.length === 0 && currentTree?.name.includes("(Demo)") && (
                  <Button 
                    onClick={async () => {
                      const treeId = await useDataStore.getState().createNewTree("My Opportunity Tree")
                      toast({
                        title: "Tree Created",
                        description: "You can now upload interviews for AI analysis",
                      })
                    }}
                    className="gap-2"
                  >
                    Create a Tree to Upload Interviews
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {filteredAndSortedInterviews.map((interview) => {
                const opportunities = getInterviewOpportunities(interview.id)
                // Use database snapshot if available, otherwise fall back to demo data
                const dbSnapshot = snapshots[interview.id]
                
                const snapshot = dbSnapshot || (opportunities.length > 0 ? {
                  status: "completed" as const,
                  participant_name: interview.participantName,
                  opportunities: opportunities.map(opp => ({
                    title: opp.title,
                    description: opp.description,
                    evidence_quote: opp.evidenceQuote,
                  })),
                  insights: [],
                } : undefined)

                // Format snapshot for display
                const displaySnapshot = snapshot ? {
                  ...snapshot,
                  opportunities: snapshot.opportunities?.map(opp => ({
                    title: opp.title,
                    description: opp.description,
                    evidence_quote: opp.evidenceQuote || opp.evidence_quote,
                  })),
                  insights: snapshot.insights?.map(insight => ({
                    statement: insight.statement,
                    evidence_quote: insight.evidence_quote,
                    why_it_might_matter: insight.why_it_might_matter,
                  })),
                } : undefined

                // Show loading state for pending interviews
                if (interview.status === 'pending' && !dbSnapshot) {
                  return (
                    <Card key={interview.id} className="p-6">
                      <InterviewLoadingState />
                    </Card>
                  )
                }

                return (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    snapshot={displaySnapshot}
                    onEdit={handleEditInterview}
                    onDelete={handleDeleteInterview}
                    onCreateSnapshot={async () => {
                      try {
                        const { error } = await supabase.functions.invoke('analyze-interview', {
                          body: { interviewId: interview.id }
                        })
                        if (error) throw error
                        toast({
                          title: "Analysis Started",
                          description: "AI is analyzing the interview",
                        })
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to start analysis",
                          variant: "destructive",
                        })
                      }
                    }}
                    onViewTranscript={handleViewTranscript}
                  />
                )
              })}
            </Accordion>
          )}
        </div>
      </div>

      <InterviewUploadDialog
        open={uploadDialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={handleUploadInterview}
        editingInterview={editingInterview}
      />

      <InterviewTranscriptDialog
        open={transcriptDialogOpen}
        onOpenChange={setTranscriptDialogOpen}
        interview={selectedInterview}
      />
    </div>
  )
}

export default Interviews
