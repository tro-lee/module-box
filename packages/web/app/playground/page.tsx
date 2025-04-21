import { BreadcrumbComponent } from '@/components/playground/breadcrumb'
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
import getModuleExplorerData from '../../actions/module-explorer-data'

function LeftSidebar() {
  const explorerPromise = getModuleExplorerData()

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
                dataPromise={explorerPromise}
              />
            </Suspense>
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
        <div className="flex flex-row items-center justify-start space-x-4 absolute z-10">
          <SidebarTrigger />
          <BreadcrumbComponent />
        </div>

        <Suspense fallback={<ModuleGraphSkeleton />}>
          <div className="flex-1">
            <ModuleGraphComponent />
          </div>
        </Suspense>
      </SidebarInset>
    </div>
  )
}
