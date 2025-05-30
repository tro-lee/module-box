'use client'
'use module'

import { useImageUpload } from '@/lib/hooks/use-image-upload'
import { useSolutionManager } from '@/lib/hooks/use-solution-manager'
import { useInitSolutionTask } from '@/lib/hooks/use-task'
import { random } from 'lodash'
import { ImagePlus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Input } from '../ui/input'

export function UploadImageArea() {
  const param = useParams<{ id: string }>()
  const router = useRouter()
  const {
    previewBase64,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
  } = useImageUpload()
  const { addTask, startTask } = useInitSolutionTask()
  const { addSolution } = useSolutionManager()

  // 监听粘贴事件
  useEffect(() => {
    window.addEventListener('paste', async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            const transfer = new DataTransfer()
            transfer.items.add(file!)
            const fileList = transfer.files

            if (file) {
              // @ts-expect-error 这里可以代替Event
              handleFileChange({ target: { files: fileList } })
            }
          }
        }
      }
    })
    return () => {
      window.removeEventListener('paste', () => { })
    }
  }, [handleFileChange])

  // 监听图变化
  useEffect(() => {
    if (previewBase64) {
      addSolution({
        name: `新建方案#${random(1000, false)}`,
        id: param.id,
        imageBase64: previewBase64,
      })

      const task = addTask(param.id, previewBase64)
      startTask(task)
      router.push(`/update-solution/${param.id}`)
    }
  }, [previewBase64, addTask])

  return (
    <main
      onClick={handleThumbnailClick}
      className="w-full h-full flex justify-center items-center overflow-hidden rounded-xl"
    >
      <Input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <section
        className="-translate-y-1/2 flex flex-col items-center justify-center cursor-pointer gap-2"
      >
        <ImagePlus className="h-6 w-6 text-muted-foreground" />
        <div className="text-center text-muted-foreground">
          <p>点击上传</p>
          <p className="text-sm">
            或者直接Command + V 粘贴图片
          </p>
        </div>
      </section>
    </main>
  )
}
