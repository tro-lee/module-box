'use module'

import { ComponentSidebar } from '@/components/component-sidebar/sidebar'
import { ModuleFlow } from '@/components/playground/module-flow'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default async function Page() {
  return (
    <main className="flex-1 flex">
      <div className="flex flex-row items-center justify-start p-2 space-x-2 absolute z-10 text-muted-foreground">
        <SidebarTrigger />
      </div>

      <ModuleFlow />

      <aside className="absolute right-0">
        <ComponentSidebar />
      </aside>
    </main>
  )
}
