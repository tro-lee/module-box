import { BreadcrumbComponent } from '@/components/playground/breadcrumb'
import { DockComponent } from '@/components/playground/dock'
import {
  ModuleExplorerComponent,
  ModuleExplorerSkeleton,
} from '@/components/playground/module-explorer'
import {
  ModuleGraphComponent,
  ModuleGraphSkeleton,
} from '@/components/playground/module-graph'
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { File } from 'lucide-react'
import { Suspense } from 'react'
import { getModuleExplorerElements, getModulesAndComponents } from './action'

function LeftSidebar() {
  const elements = getModuleExplorerElements()

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
            <Suspense fallback={<ModuleExplorerSkeleton />}>
              <ModuleExplorerComponent
                elementsPromise={elements}
              />
            </Suspense>
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
      <DockComponent />
    </div>
  )
}

function TopBar() {
  return (
    <div className="flex flex-row items-center justify-start space-x-4 absolute z-10">
      <SidebarTrigger />
      <BreadcrumbComponent />
    </div>
  )
}

export default async function DashboardPage() {
  return (
    <div className="h-full w-full flex">
      <LeftSidebar />
      <SidebarInset>
        <TopBar />
        <Suspense fallback={<ModuleGraphSkeleton />}>
          <ModuleGraph />
        </Suspense>
      </SidebarInset>
    </div>
  )
}
