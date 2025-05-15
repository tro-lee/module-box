'use module'

import { ImageCropper } from '@/components/solution/image-cropper'
import { TaskList } from '@/components/solution/task-list'

export default function Page() {
  return (
    <main className="h-full w-full">
      <TaskList />
      <ImageCropper />
    </main>
  )
}
