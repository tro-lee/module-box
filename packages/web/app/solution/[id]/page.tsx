'use module'

import { ImageCropper } from '@/components/solution/image-cropper'
import { Keeper } from '@/components/solution/keeper'
import { TaskList } from '@/components/solution/task-list'

export default function Page() {
  return (
    <main className="h-full w-full">
      <Keeper />
      <TaskList />
      <ImageCropper />
    </main>
  )
}
