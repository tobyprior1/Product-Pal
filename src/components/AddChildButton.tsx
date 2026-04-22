import { Plus, Lightbulb, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface AddChildButtonProps {
  onAddChild: () => void
  disabled?: boolean
  showOpportunityMenu?: boolean
  onAddSubOpportunity?: () => void
  canAddSubOpportunity?: boolean
  canAddSolution?: boolean
}

export function AddChildButton({
  onAddChild,
  disabled,
  showOpportunityMenu = false,
  onAddSubOpportunity,
  canAddSubOpportunity = true,
  canAddSolution = true,
}: AddChildButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddChild()
  }

  if (showOpportunityMenu && onAddSubOpportunity) {
    return (
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="default"
              className="h-8 w-8 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 bg-primary"
              disabled={disabled}
              title="Add child node"
              onClick={(e) => e.stopPropagation()}
            >
              <Plus className="h-4 w-4" />
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
              <Zap className="mr-2 h-4 w-4" />
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
    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <Button
        size="icon"
        variant="default"
        className="h-8 w-8 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 bg-primary"
        onClick={handleClick}
        disabled={disabled}
        title="Add child node"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
