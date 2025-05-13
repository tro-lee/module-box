import { TaskList } from '@/components/create-solution/task-list'
import { UploadImgArea } from '@/components/create-solution/upload-img-area'

export default async function Page() {
  return (
    <main className="h-full w-full flex justify-between">
      <TaskList />
      <UploadImgArea />
    </main>
  )
}
