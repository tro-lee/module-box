'use module'

import { ComponentDetail } from '@/components/playground/component-detail'
import { ModuleFlow } from '@/components/playground/module-flow'
import { PathBreadcrumb } from '@/components/playground/path-breadcrumb'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default async function Page() {
  return (
    <main className="flex-1 flex">
      <div className="flex flex-row items-center justify-start p-2 space-x-2 absolute z-10 text-muted-foreground">
        <SidebarTrigger />
        <PathBreadcrumb />
      </div>

      <ModuleFlow />

      <aside className="absolute right-0 p-2 pt-8">
        <ComponentDetail />
      </aside>
    </main>
  )
}
