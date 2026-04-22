import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"
import { 
  LayoutGrid, 
  Target, 
  Lightbulb, 
  FlaskConical, 
  GitBranch, 
  Presentation, 
  FileImage, 
  FileText, 
  Brush, 
  List,
  Plus
} from "lucide-react"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = window.location
  const nodes = useDataStore((state) => state.nodes)
  const setFocusedNodeId = useUIStore((state) => state.setFocusedNodeId)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleNodeSelect = (nodeId: string) => {
    setFocusedNodeId(nodeId)
    navigate("/editor")
    setOpen(false)
  }

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  const outcomes = nodes.filter((n) => n.type === "Outcome")
  const opportunities = nodes.filter((n) => n.type === "Opportunity")
  const solutions = nodes.filter((n) => n.type === "Solution")
  const experiments = nodes.filter((n) => n.type === "Experiment")
  
  const isEditorPage = location.pathname.includes("/editor")

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search nodes or navigate..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => { navigate("/"); setOpen(false) }}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/editor"); setOpen(false) }}>
            <GitBranch className="mr-2 h-4 w-4" />
            <span>Editor</span>
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/work"); setOpen(false) }}>
            <Target className="mr-2 h-4 w-4" />
            <span>Work View</span>
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/roadmap"); setOpen(false) }}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            <span>Roadmap</span>
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/interviews"); setOpen(false) }}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Interviews</span>
          </CommandItem>
          <CommandItem onSelect={() => { navigate("/present"); setOpen(false) }}>
            <Presentation className="mr-2 h-4 w-4" />
            <span>Present</span>
          </CommandItem>
        </CommandGroup>

        {isEditorPage && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new Event("tidy-layout")))}>
                <Brush className="mr-2 h-4 w-4" />
                <span>Tidy Layout</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'n',
                  ctrlKey: true,
                  bubbles: true
                })
                document.dispatchEvent(event)
              })}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Create New Node</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new Event("export-png")))}>
                <FileImage className="mr-2 h-4 w-4" />
                <span>Export as PNG</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new Event("export-pdf")))}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Export as PDF</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {outcomes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Outcomes">
              {outcomes.map((node) => (
                <CommandItem key={node.id} onSelect={() => handleNodeSelect(node.id)}>
                  <Target className="mr-2 h-4 w-4" />
                  <span>{node.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {opportunities.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Opportunities">
              {opportunities.slice(0, 5).map((node) => (
                <CommandItem key={node.id} onSelect={() => handleNodeSelect(node.id)}>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  <span>{node.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {solutions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Solutions">
              {solutions.slice(0, 5).map((node) => (
                <CommandItem key={node.id} onSelect={() => handleNodeSelect(node.id)}>
                  <GitBranch className="mr-2 h-4 w-4" />
                  <span>{node.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {experiments.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Experiments">
              {experiments.slice(0, 5).map((node) => (
                <CommandItem key={node.id} onSelect={() => handleNodeSelect(node.id)}>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  <span>{node.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
