import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, ChevronRight } from "lucide-react"

interface OnboardingTooltipProps {
  step: number
  totalSteps: number
  title: string
  description: string
  position: { top?: string; bottom?: string; left?: string; right?: string }
  onNext: () => void
  onSkip: () => void
}

export function OnboardingTooltip({
  step,
  totalSteps,
  title,
  description,
  position,
  onNext,
  onSkip,
}: OnboardingTooltipProps) {
  return (
    <Card
      className="fixed z-50 p-4 max-w-sm shadow-lg border-primary/50 animate-in fade-in slide-in-from-bottom-2"
      style={position}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={onSkip}>
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 w-6 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <Button size="sm" onClick={onNext}>
          {step === totalSteps - 1 ? "Got it" : "Next"}
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </Card>
  )
}
