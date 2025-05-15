'use client'
'use module'

import { useImageUpload } from '@/hooks/use-image-upload'
import { useTaskManagerStore } from '@/stores/task/task-manager-store'
import { ImagePlus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Input } from '../ui/input'

export function UploadImgArea() {
  const param = useParams<{ id: string }>()
  const router = useRouter()
  const {
    previewBase64,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
  } = useImageUpload()
  const addInitSolutionTask = useTaskManagerStore(state => state.addInitSolutionTask)

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
      addInitSolutionTask(param.id, previewBase64)
      router.push(`/solution/${param.id}`)
    }
  }, [previewBase64, addInitSolutionTask])

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
