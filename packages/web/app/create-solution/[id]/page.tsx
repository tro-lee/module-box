'use module'

import { UploadImgArea } from '@/components/create-solution/upload-img-area'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { cn } from '@/lib/utils'

export default async function Page() {
  return (
    <main className="h-full w-full overflow-hidden">
      <UploadImgArea />
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
