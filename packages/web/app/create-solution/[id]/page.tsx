'use module'

import { UploadImageArea } from '@/components/solution/upload-image-area'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export default async function Page() {
  return (
    <main className="h-full w-full overflow-hidden">
      <div className="p-2 absolute z-10 text-muted-foreground">
        <SidebarTrigger />
      </div>
      <UploadImageArea />
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] skew-y-12',
        )}
      />
    </main>
  )
}
