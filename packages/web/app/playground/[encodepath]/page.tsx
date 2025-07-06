'use module'

import { ModuleFlow } from '@/components/module-flow/module-flow'
import { Toolbar } from '@/components/toolbar/toolbar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import getModuleFlowData from '@/lib/actions/module-flow-data'
import { Suspense } from 'react'

export default async function Page({ params }: { params: { encodepath: string } }) {
  const path = decodeURIComponent(params.encodepath || '')
  const promise = getModuleFlowData(path)

  return (
    <main className="flex-1 flex">
      <div className="p-2 space-x-2 absolute z-10 text-muted-foreground">
        <SidebarTrigger />
      </div>

      <Suspense fallback={(
        <div className="flex flex-1 flex-col justify-center items-center text-muted-foreground">
          <Spinner variant="bars" className="w-8 h-8 -translate-y-1/2" />
          <p>
            正在解析
            {' '}
            {path.split('/').slice(-1)}
          </p>
        </div>
      )}
      >
        <ModuleFlow promise={promise} />
      </Suspense>

      <aside className="absolute right-0">
        <Toolbar />
      </aside>
    </main>
  )
}
