import { Button } from "@/components/ui/button"
import {
  Network,
  Download,
  FileText,
  History,
  X,
  Undo,
  Redo,
  Lock,
  LockOpen,
  Eye,
  EyeOff,
  List,
  Calendar,
  Home,
  Brush,
  Presentation,
  Plus,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useDataStore } from "@/lib/pm-supabase-store"
import { useUIStore } from "@/lib/pm-ui-store"
import { useState } from "react"
import { VersionsDialog } from "./VersionsDialog"

interface TopbarProps {
  onTidy?: () => void
  onExportPNG?: () => void
  onExportPDF?: () => void
  onNewNode?: () => void
}

export function Topbar({ onTidy, onExportPNG, onExportPDF, onNewNode }: TopbarProps) {

  const location = useLocation()
  const [versionsOpen, setVersionsOpen] = useState(false)
  
  const focusedNodeId = useUIStore((state) => state.focusedNodeId)
  const setFocusedNodeId = useUIStore((state) => state.setFocusedNodeId)
  const isLocked = useUIStore((state) => state.isLocked)
  const toggleLock = useUIStore((state) => state.toggleLock)
  const showCompletedExperiments = useUIStore((state) => state.showCompletedExperiments)
  const toggleShowCompleted = useUIStore((state) => state.toggleShowCompleted)
  const undo = useDataStore((state) => state.undo)
  const redo = useDataStore((state) => state.redo)
  const canUndo = useDataStore((state) => state.canUndo())
  const canRedo = useDataStore((state) => state.canRedo())

  const handleExitFocus = () => {
    setFocusedNodeId(null)
  }

  const isEditorView = location.pathname.includes("/editor")

  return (
    <>
      <div className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-semibold tracking-tight text-foreground hover:text-primary transition-colors">
            Product Pal
          </Link>
          <DropdownMenu>

            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                {isEditorView ? (
                  <>
                    <Network className="w-4 h-4" />
                    Tree View
                  </>
                ) : location.pathname.includes("/work") ? (
                  <>
                    <List className="w-4 h-4" />
                    Work View
                  </>
                ) : location.pathname.includes("/roadmap") ? (
                  <>
                    <Calendar className="w-4 h-4" />
                    Roadmap
                  </>
                ) : location.pathname.includes("/interviews") ? (
                  <>
                    <FileText className="w-4 h-4" />
                    Interviews
                  </>
                ) : (
                  <>
                    <Network className="w-4 h-4" />
                    Tree View
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link to="/editor" className="gap-2 cursor-pointer">
                  <Network className="w-4 h-4" />
                  Tree View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/work" className="gap-2 cursor-pointer">
                  <List className="w-4 h-4" />
                  Work View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/roadmap" className="gap-2 cursor-pointer">
                  <Calendar className="w-4 h-4" />
                  Roadmap
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/interviews" className="gap-2 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  Interviews
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isEditorView && (
            <div className="flex items-center gap-1">
              <Button onClick={undo} size="sm" variant="ghost" disabled={!canUndo} title="Undo (⌘Z)">
                <Undo className="w-4 h-4" />
              </Button>
              <Button onClick={redo} size="sm" variant="ghost" disabled={!canRedo} title="Redo (⌘⇧Z)">
                <Redo className="w-4 h-4" />
              </Button>
              <Button
                onClick={toggleLock}
                size="sm"
                variant="ghost"
                title={isLocked ? "Unlock canvas" : "Lock canvas"}
                className={isLocked ? "text-amber-600" : ""}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
              </Button>
              <Button
                onClick={toggleShowCompleted}
                size="sm"
                variant="ghost"
                title={showCompletedExperiments ? "Hide completed experiments" : "Show completed experiments"}
              >
                {showCompletedExperiments ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              {onNewNode && (
                <Button
                  onClick={onNewNode}
                  size="sm"
                  variant="ghost"
                  title="Add new node (Ctrl+N)"
                  className="ml-2"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {focusedNodeId && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <span className="text-xs font-medium text-blue-600">Focus Mode Active</span>
              <Button onClick={handleExitFocus} size="sm" variant="ghost" className="h-5 w-5 p-0 hover:bg-blue-500/20">
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onTidy && (
            <Button onClick={onTidy} size="sm" variant="ghost">
              <Brush className="w-4 h-4 mr-2" />
              Tidy
            </Button>
          )}

          {isEditorView && (
            <Button asChild size="sm" variant="ghost">
              <Link to="/present">
                <Presentation className="w-4 h-4 mr-2" />
                Present
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExportPNG && (
                <DropdownMenuItem onClick={onExportPNG}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export PNG (2×)
                </DropdownMenuItem>
              )}
              {onExportPDF && (
                <DropdownMenuItem onClick={onExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF (A3)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setVersionsOpen(true)} size="sm" variant="ghost">
            <History className="w-4 h-4 mr-2" />
            Versions
          </Button>

          <Button asChild size="sm" variant="default" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>

      <VersionsDialog open={versionsOpen} onOpenChange={setVersionsOpen} />
    </>
  )
}
