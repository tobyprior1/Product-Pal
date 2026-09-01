import { Plus, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HIERARCHY_STYLES, type HierarchyKind } from "@/lib/pm-hierarchy"
import { cn } from "@/lib/utils"
import { SOLUTION_BLOCKED_HINT, SUB_OPPORTUNITY_BLOCKED_HINT } from "./AddChildButton"

interface AddChildPanelButtonProps {
  childKind: Extract<HierarchyKind, "opportunity" | "solution" | "experiment">
  onAddChild: () => void
  disabled?: boolean
  /** Opportunity nodes can also spawn sub-opportunities. */
  onAddSubOpportunity?: () => void
  canAddSubOpportunity?: boolean
  canAddSolution?: boolean
}

export function AddChildPanelButton({
  childKind,
  onAddChild,
  disabled,
  onAddSubOpportunity,
  canAddSubOpportunity = true,
  canAddSolution = true,
}: AddChildPanelButtonProps) {
  const style = HIERARCHY_STYLES[childKind]
  const ChildIcon = style.icon

  const buttonClasses = cn("w-full justify-start gap-2 text-xs font-medium", style.text, style.surfaceHover)

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block">
            <Button
              variant="outline"
              className={buttonClasses}
              onClick={onAddChild}
              disabled={disabled || !canAddSolution}
            >
              <Plus className="h-3.5 w-3.5" />
              <ChildIcon className="h-3.5 w-3.5" />
              Add {style.label}
            </Button>
          </span>
        </TooltipTrigger>
        {!canAddSolution && (
          <TooltipContent side="left" className="max-w-xs">
            {SOLUTION_BLOCKED_HINT}
          </TooltipContent>
        )}
      </Tooltip>

      {onAddSubOpportunity && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start gap-2 text-xs font-medium",
                  HIERARCHY_STYLES.opportunity.text,
                  HIERARCHY_STYLES.opportunity.surfaceHover,
                )}
                onClick={onAddSubOpportunity}
                disabled={disabled || !canAddSubOpportunity}
              >
                <Plus className="h-3.5 w-3.5" />
                <Lightbulb className="h-3.5 w-3.5" />
                Add Sub-Opportunity
              </Button>
            </span>
          </TooltipTrigger>
          {!canAddSubOpportunity && (
            <TooltipContent side="left" className="max-w-xs">
              {SUB_OPPORTUNITY_BLOCKED_HINT}
            </TooltipContent>
          )}
        </Tooltip>
      )}
    </div>
  )
}
