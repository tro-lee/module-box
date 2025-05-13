import { BreadcrumbComponent } from '@/components/playground/breadcrumb'
import { DetailCardComponent } from '@/components/playground/detail-card'
import {
  ModuleGraphComponent,
  ModuleGraphSkeleton,
} from '@/components/playground/module-graph'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Suspense } from 'react'

export default async function DashboardPage() {
  return (
    <main className="flex-1 flex">
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
    </main>
  )
}
