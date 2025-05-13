'use client'

import type { ReactCropperElement } from 'react-cropper'
import { useImageUpload } from '@/hooks/use-image-upload'
import { useSolutionManagerStore } from '@/store/solution-store'
import { ImagePlus } from 'lucide-react'
import { useEffect, useRef } from 'react'
import Cropper from 'react-cropper'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import 'cropperjs/dist/cropper.css'

export function UploadImgArea() {
  // 处理图片上传
  const cropperRef = useRef<ReactCropperElement>(null)
  const {
    previewBase64,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
  } = useImageUpload()

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
  }, [])

  // 添加方案任务相关
  const setSolution = useSolutionManagerStore(state => state.setSolution)
  const addSolutionTask = useSolutionManagerStore(state => state.addSolutionTask)

  const handleButtonClick = () => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')

    if (typeof cropperRef.current?.cropper !== 'undefined' && id) {
      const croppedBase64 = cropperRef.current?.cropper.getCroppedCanvas().toDataURL()
      setSolution({ id: id! })
      addSolutionTask(id, croppedBase64)
    }
  }

  return (
    <section className="relative w-[48vw] h-full overflow-hidden rounded-r-xl rounded-l-none bg-sidebar ">
      <Input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {
        !previewBase64 && (
          <div
            onClick={handleThumbnailClick}
            className="w-full h-full border-dashed border-2 rounded-r-xl flex flex-col items-center justify-center cursor-pointer gap-2 animate-pulse duration-[2000ms]"
          >
            <div className="rounded-full bg-background p-3 shadow-sm">
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">点击上传</p>
              <p className="text-xs text-muted-foreground">
                或者直接Command + V 粘贴图片
              </p>
            </div>
          </div>
        )
      }

      {
        previewBase64 && (
          <Cropper
            ref={cropperRef}
            src={previewBase64!}
            className="w-full h-full bg-muted-foreground"
            dragMode="move"
            background={false}
            initialAspectRatio={4}
            guides={false}
            checkOrientation={false}
          />
        )
      }
      {
        previewBase64 && (
          <Button onClick={handleButtonClick} className="absolute bottom-4 right-4">
            上传裁剪
          </Button>
        )
      }

    </section>
  )
}
