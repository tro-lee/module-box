'use module'

import { ImageCropper } from '@/components/solution/image-cropper'
import { SolutionDetail } from '@/components/solution/solution-detail'

export default function Page() {
  return (
    <main className="h-full w-full flex flex-row overflow-hidden">
      <SolutionDetail />
      <div className="w-[40vw] h-full rounded-l-none rounded-r-xl overflow-hidden">
        <ImageCropper />
      </div>
    </main>
  )
}
