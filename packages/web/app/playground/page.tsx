import { BreadcrumbComponent } from '@/components/playground/breadcrumb'
import { DetailCardComponent } from '@/components/playground/detail-card'
import {
  ModuleExplorer,
  ModuleExplorerSkeleton,
} from '@/components/playground/module-explorer'
import {
  ModuleGraphComponent,
  ModuleGraphSkeleton,
} from '@/components/playground/module-graph'
import { TaskExplorer } from '@/components/playground/task-explorer'
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { File, List } from 'lucide-react'
import { Suspense } from 'react'
import getModuleExplorerData from '../../actions/module-explorer-data'

function LeftSidebar() {
  const explorerPromise = getModuleExplorerData()

  return (
    <Sidebar variant="inset" side="left" className="overflow-auto">
      <Tabs defaultValue="explorer">
        <SidebarHeader className="p-0 border-b">
          <TabsList className="flex flex-row justify-start">
            <TabsTrigger value="explorer">
              <File className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <List className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </SidebarHeader>

        <SidebarContent>
          <TabsContent value="explorer">
            <Suspense fallback={<ModuleExplorerSkeleton />}>
              <ModuleExplorer
                dataPromise={explorerPromise}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="tasks">
            <TaskExplorer />
          </TabsContent>
        </SidebarContent>
      </Tabs>
    </Sidebar>
  )
}

export default async function DashboardPage() {
  return (
    <div className="h-full w-full flex">
      <LeftSidebar />
      <SidebarInset>
        <div className="flex flex-row items-center justify-start p-2 space-x-2 absolute z-10 text-muted-foreground">
          <SidebarTrigger />
          <BreadcrumbComponent />
        </div>

        <Suspense fallback={<ModuleGraphSkeleton />}>
          <div className="flex-1">
            <ModuleGraphComponent />
          </div>
        </Suspense>

        <aside className="absolute right-0 p-2 pt-8">
          <DetailCardComponent />
        </aside>
      </SidebarInset>
    </div>
  )
}
