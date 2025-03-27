import {
  ModuleExplorer,
  ModuleExplorerSkeleton,
} from '@/components/playground/module-explorer'
import {
  ModuleGraphComponent,
  ModuleGraphSkeleton,
} from '@/components/playground/module-graph'
import { ProgressDock } from '@/components/playground/progress-dock'
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { File } from 'lucide-react'
import { Suspense } from 'react'
import { getModuleExplorerElements, getModulesAndComponents } from './action'

export default async function DashboardPage() {
  return (
    <div className="h-full w-full flex">
      <LeftSidebar />
      <SidebarInset>
        <SidebarTrigger />
        <Suspense fallback={<ModuleGraphSkeleton />}>
          <ModuleGraph />
        </Suspense>
        <Dock />
      </SidebarInset>
    </div>
  )
}

function LeftSidebar() {
  const elements = getModuleExplorerElements()

  // Explorer
  const Explorer = () =>
    (
      <Suspense fallback={<ModuleExplorerSkeleton />}>
        <ModuleExplorer
          elementsPromise={elements}
        />
      </Suspense>
    )

  return (
    <Sidebar variant="inset" side="left" className="overflow-auto">
      <Tabs defaultValue="explorer">
        <SidebarHeader>
          <TabsList>
            <TabsTrigger value="explorer">
              <File />
            </TabsTrigger>
            <TabsTrigger value="graph">
              <File />
            </TabsTrigger>
          </TabsList>
        </SidebarHeader>

        <SidebarContent>
          <TabsContent value="explorer">
            <Explorer />
          </TabsContent>
        </SidebarContent>
      </Tabs>
    </Sidebar>
  )
}

function ModuleGraph() {
  const promise = getModulesAndComponents()
  return (
    <div className="flex-1">
      <ModuleGraphComponent promise={promise} />
    </div>
  )
}

function Dock() {
  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-center">
      <ProgressDock />
    </div>
  )
}
