import { User, Lightbulb, Quote, Target, Sparkles } from "lucide-react"

interface InterviewSnapshotSummaryProps {
  snapshot: {
    participant_name?: string
    quick_facts?: string[]
    memorable_quote?: {
      quote: string
      evidence_ref: string
    }
    opportunities?: Array<{
      title: string
      description: string
      evidence_quote?: string
    }>
    insights?: Array<{
      statement: string
      evidence_quote?: string
      why_it_might_matter?: string
    }>
  }
}

export function InterviewSnapshotSummary({ snapshot }: InterviewSnapshotSummaryProps) {
  return (
    <div className="space-y-4">
      {snapshot.participant_name && (
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
          <User className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Participant</p>
            <p className="text-sm text-muted-foreground">{snapshot.participant_name}</p>
          </div>
        </div>
      )}

      {snapshot.quick_facts && snapshot.quick_facts.length > 0 && (
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
          <Lightbulb className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1">Quick Facts</p>
            <ul className="text-sm text-muted-foreground space-y-0.5">
              {snapshot.quick_facts.slice(0, 3).map((fact, idx) => (
                <li key={idx} className="line-clamp-1">
                  • {fact}
                </li>
              ))}
              {snapshot.quick_facts.length > 3 && (
                <li className="text-xs italic">+{snapshot.quick_facts.length - 3} more</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {snapshot.memorable_quote?.quote && (
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
          <Quote className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1">Memorable Quote</p>
            <p className="text-sm text-muted-foreground italic line-clamp-2">"{snapshot.memorable_quote.quote}"</p>
          </div>
        </div>
      )}

      {snapshot.opportunities && snapshot.opportunities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Opportunities ({snapshot.opportunities.length})</p>
          </div>
          <div className="space-y-2">
            {snapshot.opportunities.map((opp, idx) => (
              <div key={idx} className="p-3 bg-primary/5 border border-primary/10 rounded-md">
                <p className="text-sm font-medium text-foreground mb-1">{opp.title}</p>
                <p className="text-sm text-muted-foreground">{opp.description}</p>
                {opp.evidence_quote && (
                  <p className="text-xs text-muted-foreground italic mt-2 pl-3 border-l-2 border-primary/20">
                    "{opp.evidence_quote}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {snapshot.insights && snapshot.insights.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Insights ({snapshot.insights.length})</p>
          </div>
          <div className="space-y-2">
            {snapshot.insights.map((insight, idx) => (
              <div key={idx} className="p-3 bg-muted/50 border border-border rounded-md">
                <p className="text-sm text-foreground">{insight.statement}</p>
                {insight.evidence_quote && (
                  <p className="text-xs text-muted-foreground italic mt-2 pl-3 border-l-2 border-muted-foreground/20">
                    "{insight.evidence_quote}"
                  </p>
                )}
                {insight.why_it_might_matter && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <span className="font-medium">Why it matters:</span> {insight.why_it_might_matter}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
