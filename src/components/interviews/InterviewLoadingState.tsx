import { Sparkles, Loader2 } from "lucide-react"

export function InterviewLoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <Loader2 className="w-6 h-6 text-primary animate-spin absolute -top-1 -right-1" />
        </div>
        <h3 className="text-lg font-semibold mb-2">AI Analysis in Progress</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          Our AI is analyzing the interview transcript to identify opportunities and insights. This usually takes 30-60
          seconds.
        </p>

        {/* Skeleton placeholders */}
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-md space-y-2 animate-pulse">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-5/6 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
