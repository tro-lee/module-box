import { BreadcrumbComponent } from '@/components/playground/breadcrumb'
import { DetailCard } from '@/components/playground/detail-card'
import {
  ModuleFlow,
  ModuleFlowSkeleton,
} from '@/components/playground/module-flow'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Suspense } from 'react'

export default async function DashboardPage() {
  return (
    <main className="flex-1 flex">
      <div className="flex flex-row items-center justify-start p-2 space-x-2 absolute z-10 text-muted-foreground">
        <SidebarTrigger />
        <BreadcrumbComponent />
      </div>

      <Suspense fallback={<ModuleFlowSkeleton />}>
        <div className="flex-1">
          <ModuleFlow />
        </div>
      </Suspense>

      <aside className="absolute right-0 p-2 pt-8">
        <DetailCard />
      </aside>
    </main>
  )
}
