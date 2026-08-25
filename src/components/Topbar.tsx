import { Button } from "@/components/ui/button"
import {
  Network,
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
  Brush,
  Presentation,
  Plus,
  ChevronDown,
  ChevronLeft,
  Share2,
  FileImage,
  Home,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  const currentTree = useDataStore((state) => state.currentTree)
  const projects = useDataStore((state) => state.projects)

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

  const isEditorView = location.pathname.includes("/editor")

  const views = [
    { to: "/editor", label: "Tree View", icon: Network, match: "/editor" },
    { to: "/work", label: "Work View", icon: List, match: "/work" },
    { to: "/roadmap", label: "Roadmap", icon: Calendar, match: "/roadmap" },
    { to: "/interviews", label: "Interviews", icon: FileText, match: "/interviews" },
  ]
  const activeView = views.find((v) => location.pathname.includes(v.match)) ?? views[0]
  const ActiveIcon = activeView.icon
  const isTreeView = views.some((v) => location.pathname.includes(v.match))

  const parentProject = currentTree?.projectId
    ? projects.find((p) => p.id === currentTree.projectId)
    : null
  const breadcrumbLabel = parentProject?.name ?? currentTree?.name ?? null
  const backTo = parentProject ? `/projects/${parentProject.id}` : "/"

  return (
    <>
      <div className="px-3 pt-3 pb-1">
        <nav className="relative h-14 flex items-center justify-between px-3 rounded-2xl border border-border bg-background/80 backdrop-blur-md shadow-sm">
          {/* Left: brand + view switcher + breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to={currentTree ? backTo : "/"}
              className="flex items-center gap-2 group shrink-0 min-w-0"
              title={currentTree ? "Back to project" : "Home"}
            >
              {currentTree && (
                <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              )}
              <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm group-hover:opacity-90 transition-opacity">
                P
              </span>
              <span className="font-semibold tracking-tight text-foreground">Product Pal</span>
              {currentTree && breadcrumbLabel && (
                <>
                  <span className="h-4 w-px bg-border mx-1" />
                  <span
                    className="text-sm text-muted-foreground truncate max-w-[140px] sm:max-w-[180px] md:max-w-[240px] hidden sm:block"
                    title={breadcrumbLabel}
                  >
                    {breadcrumbLabel}
                  </span>
                </>
              )}
            </Link>

            <div className="h-4 w-px bg-border" />

            {isTreeView ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground h-8"
                  >
                    <ActiveIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{activeView.label}</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {views.map(({ to, label, icon: Icon }) => (
                    <DropdownMenuItem key={to} asChild>
                      <Link to={to} className="gap-2 cursor-pointer">
                        <Icon className="w-4 h-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className="hidden sm:inline text-sm text-muted-foreground">Tree View</span>
            )}


            {focusedNodeId && (
              <button
                onClick={() => setFocusedNodeId(null)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                title="Exit focus mode"
              >
                Focus mode
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Center: canvas action pill */}
          {isEditorView && (
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-0.5 p-1 rounded-xl border border-border bg-muted/60">
              <Button
                onClick={undo}
                disabled={!canUndo}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-background"
                title="Undo (⌘Z)"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                onClick={redo}
                disabled={!canRedo}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-background"
                title="Redo (⌘⇧Z)"
              >
                <Redo className="w-4 h-4" />
              </Button>

              <div className="w-px h-4 bg-border mx-1.5" />

              {onNewNode && (
                <Button
                  onClick={onNewNode}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 hover:bg-background"
                  title="Add node (⌘N)"
                >
                  <Plus className="w-4 h-4" />
                  Node
                </Button>
              )}
              {onTidy && (
                <Button onClick={onTidy} variant="ghost" size="sm" className="h-8 gap-1.5 hover:bg-background">
                  <Brush className="w-4 h-4" />
                  Tidy
                </Button>
              )}
            </div>
          )}

          {/* Right: global actions */}
          <div className="flex items-center gap-1">
            {isEditorView && (
              <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-xl border border-border bg-muted/40">
                <Button
                  onClick={toggleLock}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-background"
                  title={isLocked ? "Unlock canvas" : "Lock canvas"}
                >
                  {isLocked ? <Lock className="w-4 h-4 text-primary" /> : <LockOpen className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={toggleShowCompleted}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-background"
                  title={showCompletedExperiments ? "Hide completed experiments" : "Show completed experiments"}
                >
                  {showCompletedExperiments ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-9 rounded-xl gap-2">
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/present" className="gap-2 cursor-pointer">
                    <Presentation className="w-4 h-4" />
                    Present
                  </Link>
                </DropdownMenuItem>
                {(onExportPNG || onExportPDF) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Export</DropdownMenuLabel>
                    {onExportPNG && (
                      <DropdownMenuItem onClick={onExportPNG} className="gap-2">
                        <FileImage className="w-4 h-4" />
                        PNG (2×)
                      </DropdownMenuItem>
                    )}
                    {onExportPDF && (
                      <DropdownMenuItem onClick={onExportPDF} className="gap-2">
                        <FileText className="w-4 h-4" />
                        PDF (A3)
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setVersionsOpen(true)} className="gap-2">
                  <History className="w-4 h-4" />
                  Version history
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
              title="Home"
              asChild
            >
              <Link to="/">
                <Home className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </div>

      <VersionsDialog open={versionsOpen} onOpenChange={setVersionsOpen} />
    </>
  )
}
