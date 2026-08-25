import { Plus, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { HIERARCHY_STYLES, type HierarchyKind } from "@/lib/pm-hierarchy"
import { cn } from "@/lib/utils"

interface AddChildButtonProps {
  /** The kind of child this node creates (Outcome -> opportunity, etc.). */
  childKind: Extract<HierarchyKind, "opportunity" | "solution" | "experiment">
  onAddChild: () => void
  disabled?: boolean
  showOpportunityMenu?: boolean
  onAddSubOpportunity?: () => void
  canAddSubOpportunity?: boolean
  canAddSolution?: boolean
}

const wrapperClasses =
  "absolute -bottom-5 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"

export function AddChildButton({
  childKind,
  onAddChild,
  disabled,
  showOpportunityMenu = false,
  onAddSubOpportunity,
  canAddSubOpportunity = true,
  canAddSolution = true,
}: AddChildButtonProps) {
  const style = HIERARCHY_STYLES[childKind]
  const ChildIcon = style.icon

  const pillClasses = cn(
    "h-8 gap-1.5 rounded-full border bg-card px-3 text-xs font-medium shadow-md hover:shadow-lg transition-all duration-200",
    style.text,
    style.surfaceHover,
  )

  if (showOpportunityMenu && onAddSubOpportunity) {
    return (
      <div className={wrapperClasses}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={pillClasses}
              disabled={disabled}
              title={`Add ${style.label}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="h-3.5 w-3.5" />
              <ChildIcon className="h-3.5 w-3.5" />
              {style.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onAddChild()
              }}
              disabled={!canAddSolution}
            >
              <ChildIcon className="mr-2 h-4 w-4" />
              <span>Add Solution</span>
              {!canAddSolution && <span className="ml-auto text-xs text-muted-foreground">(has sub-opps)</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onAddSubOpportunity()
              }}
              disabled={!canAddSubOpportunity}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              <span>Add Sub-Opportunity</span>
              {!canAddSubOpportunity && <span className="ml-auto text-xs text-muted-foreground">(has solutions)</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className={wrapperClasses}>
      <Button
        variant="outline"
        className={pillClasses}
        onClick={(e) => {
          e.stopPropagation()
          onAddChild()
        }}
        disabled={disabled}
        title={`Add ${style.label}`}
      >
        <Plus className="h-3.5 w-3.5" />
        <ChildIcon className="h-3.5 w-3.5" />
        {style.label}
      </Button>
    </div>
  )
}
