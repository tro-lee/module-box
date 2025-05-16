'use module'

import { ImageCropper } from '@/components/solution/image-cropper'
import { SolutionDetail } from '@/components/solution/solution-detail'
import { SolutionTitle } from '@/components/solution/solution-title'

export default function Page() {
  return (
    <main className="h-full w-full flex flex-row relative">
      <div className="flex-1 p-2 flex flex-col gap-2">
        <SolutionTitle />
        <SolutionDetail />
      </div>
      <div className="w-[40vw] h-full rounded-l-none rounded-r-xl overflow-hidden">
        <ImageCropper />
      </div>
    </main>
  )
}
