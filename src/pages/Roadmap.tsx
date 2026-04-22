import { useDataStore } from "@/lib/pm-supabase-store"
import { Topbar } from "@/components/Topbar"
import { RoadmapColumn } from "@/components/RoadmapColumn"
import { GanttChart } from "@/components/GanttChart"
import type { SolutionNode } from "@/lib/pm-types"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "lucide-react"

const Roadmap = () => {
  const nodes = useDataStore((state) => state.nodes)
  const [activeTab, setActiveTab] = useState("timeline")
  
  // Get solutions by status with full context
  const solutions = nodes.filter((node) => node.type === "Solution") as SolutionNode[]
  
  // Helper to get opportunity and outcome for a solution
  const getSolutionContext = (solution: SolutionNode) => {
    const opportunity = nodes.find((n) => n.id === solution.parentId)
    if (!opportunity) return null
    
    let currentNode = opportunity
    while (currentNode.parentId) {
      const parent = nodes.find((n) => n.id === currentNode.parentId)
      if (!parent) break
      if (parent.type === "Outcome") {
        return { solution, opportunity, outcome: parent }
      }
      currentNode = parent
    }
    return null
  }
  
  const nowItems = solutions
    .filter((s) => s.status === "Now")
    .map(getSolutionContext)
    .filter(Boolean) as Array<{ solution: SolutionNode; opportunity: any; outcome: any }>
    
  const nextItems = solutions
    .filter((s) => s.status === "Next")
    .map(getSolutionContext)
    .filter(Boolean) as Array<{ solution: SolutionNode; opportunity: any; outcome: any }>
    
  const laterItems = solutions
    .filter((s) => s.status === "Later")
    .map(getSolutionContext)
    .filter(Boolean) as Array<{ solution: SolutionNode; opportunity: any; outcome: any }>

  const totalSolutions = nowItems.length + nextItems.length + laterItems.length

  const handleItemClick = (nodeId: string) => {
    // Navigate to editor or open node panel
    console.log("Clicked node:", nodeId)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Topbar />
      
      <div className="flex-1 overflow-auto">
        <div className="h-full flex flex-col p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-1">Roadmap</h1>
            <p className="text-sm text-muted-foreground">
              {totalSolutions} solution{totalSolutions !== 1 ? "s" : ""} across timeframes
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mb-4 bg-transparent border-b border-border rounded-none h-auto p-0 justify-start gap-6">
              <TabsTrigger 
                value="timeline"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-0 pb-2"
              >
                Date Delivery View
              </TabsTrigger>
              <TabsTrigger 
                value="columns"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-0 pb-2"
              >
                Now, Next, Later View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="flex-1 mt-0">
              <div className="h-full border border-border rounded-lg overflow-hidden bg-card">
                <GanttChart onItemClick={handleItemClick} />
              </div>
            </TabsContent>

            <TabsContent value="columns" className="flex-1 mt-0">
              {totalSolutions === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No solutions scheduled</h3>
                  <p className="text-sm text-muted-foreground">
                    Add solutions with Now, Next, or Later timeframes to see them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  <RoadmapColumn
                    title="Now"
                    items={nowItems}
                    onItemClick={handleItemClick}
                    color="blue"
                  />
                  <RoadmapColumn
                    title="Next"
                    items={nextItems}
                    onItemClick={handleItemClick}
                    color="gray"
                  />
                  <RoadmapColumn
                    title="Later"
                    items={laterItems}
                    onItemClick={handleItemClick}
                    color="slate"
                  />
                </div>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Roadmap
