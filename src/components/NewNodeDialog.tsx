import { useState, useEffect, useMemo, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"
import { generateUUID, createNodeMetadata } from "@/lib/pm-utils"
import type { OSTNode } from "@/lib/pm-types"
import { Lightbulb } from "lucide-react"

interface NewNodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedParentId?: string
  preselectedNodeType?: "Outcome" | "Opportunity" | "Solution" | "Experiment"
}

export function NewNodeDialog({ open, onOpenChange, preselectedParentId, preselectedNodeType }: NewNodeDialogProps) {
  const [nodeType, setNodeType] = useState<"Outcome" | "Opportunity" | "Solution" | "Experiment">("Opportunity")
  const [title, setTitle] = useState("")
  const [parentId, setParentId] = useState<string>("")

  const titleInputRef = useRef<HTMLInputElement>(null)

  const nodes = useDataStore((state) => state.nodes)
  const addNode = useDataStore((state) => state.addNode)
  const setSelectedNodeId = useUIStore((state) => state.setSelectedNodeId)

  const preselectedParent = useMemo(() => {
    if (preselectedParentId) {
      return nodes.find((n) => n.id === preselectedParentId)
    }
    return null
  }, [preselectedParentId, nodes])

  const isSubOpportunity = useMemo(() => {
    return nodeType === "Opportunity" && preselectedParent?.type === "Opportunity"
  }, [nodeType, preselectedParent])

  // Each tree represents a single Outcome, so only one root Outcome is allowed
  const hasRootOutcome = useMemo(() => nodes.some((n) => n.type === "Outcome"), [nodes])

  const potentialParents = useMemo(() => {
    switch (nodeType) {
      case "Outcome":
        return [] // Outcomes are root nodes
      case "Opportunity":
        return nodes.filter((n) => n.type === "Outcome" || n.type === "Opportunity")
      case "Solution":
        return nodes.filter((n) => n.type === "Opportunity")
      case "Experiment":
        return nodes.filter((n) => n.type === "Solution")
      default:
        return []
    }
  }, [nodeType, nodes])

  useEffect(() => {
    if (open) {
      if (preselectedNodeType) {
        setNodeType(preselectedNodeType)
      } else {
        const defaultType = nodes.length === 0 ? "Outcome" : "Opportunity"
        setNodeType(defaultType)
      }

      if (preselectedParentId) {
        setParentId(preselectedParentId)
      } else {
        setParentId("")
      }

      // Auto-focus title input after a brief delay to ensure dialog is rendered
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100)
    }
  }, [open, nodes.length, preselectedParentId, preselectedNodeType])

  const handleCreate = () => {
    if (!title.trim()) return

    const newNode: Partial<OSTNode> = {
      id: generateUUID(),
      parentId: parentId || null,
      type: nodeType,
      title: title.trim(),
      ...createNodeMetadata(),
    }

    // Add type-specific defaults
    if (nodeType === "Opportunity") {
      (newNode as any).status = "backlog"
    } else if (nodeType === "Solution") {
      (newNode as any).status = "Backlog"
    } else if (nodeType === "Experiment") {
      (newNode as any).status = "planned"
      ;(newNode as any).hypothesis = ""
      ;(newNode as any).method = ""
      ;(newNode as any).dateRange = { start: new Date().toISOString().split("T")[0] }
    }

    addNode(newNode as OSTNode)
    setSelectedNodeId(newNode.id!)
    setTitle("")
    setParentId("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle>{isSubOpportunity ? "Create Sub-Opportunity" : "Create New Node"}</DialogTitle>
          <DialogDescription>
            {isSubOpportunity && preselectedParent ? (
              <span className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" />
                <span>
                  Add a sub-opportunity under{" "}
                  <span className="font-medium text-foreground">"{preselectedParent.title}"</span>
                </span>
              </span>
            ) : (
              "Add a new node to your Opportunity Solution Tree"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <Label htmlFor="type">Node Type</Label>
            <Select value={nodeType} onValueChange={(value: any) => setNodeType(value)} disabled={!!preselectedNodeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {!hasRootOutcome && <SelectItem value="Outcome">Outcome</SelectItem>}
                <SelectItem value="Opportunity">Opportunity</SelectItem>
                <SelectItem value="Solution">Solution</SelectItem>
                <SelectItem value="Experiment">Experiment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-75">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter node title..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
              }}
            />
          </div>

          {potentialParents.length > 0 && (
            <div className="space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-150">
              <Label htmlFor="parent">Parent Node</Label>
              {preselectedParentId && preselectedParent ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-primary/20 bg-primary/5">
                  <Lightbulb className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{preselectedParent.title}</div>
                    <div className="text-xs text-muted-foreground capitalize">{preselectedParent.type}</div>
                  </div>
                </div>
              ) : (
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent node..." />
                  </SelectTrigger>
                  <SelectContent>
                    {potentialParents.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim()}>
            {isSubOpportunity ? "Create Sub-Opportunity" : "Create Node"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
