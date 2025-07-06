import {
  ModuleExplorer,
  ModuleExplorerSkeleton,
} from '@/components/main-sidebar/module-explorer'
import { TaskExplorer } from '@/components/main-sidebar/task-explorer'
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import getModuleExplorerData from '@/lib/actions/module-explorer-data'
import { File, List } from 'lucide-react'
import { Suspense } from 'react'

export function MainSidebar() {
  const explorerPromise = getModuleExplorerData()

  return (
    <Sidebar variant="inset" side="left" className="overflow-auto">
      <Tabs defaultValue="explorer">
        <SidebarHeader className="p-0 border-b">
          <TabsList className="flex flex-row justify-start">
            <TabsTrigger value="explorer">
              <File className="size-4" />
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <List className="size-4" />
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
