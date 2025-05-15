'use client'
import type { ReactCropperElement } from 'react-cropper'
import { useSolutionStore } from '@/stores/page/solution-store'
import { useParams, useRouter } from 'next/navigation'
import { useRef } from 'react'
import Cropper from 'react-cropper'
import { v4 as uuid } from 'uuid'
import { useShallow } from 'zustand/shallow'
import { Button } from '../ui/button'
import 'cropperjs/dist/cropper.css'

export function ImageCropper() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const currentSolution = useSolutionStore(useShallow(state => state.solutions[params.id]))
  const imageBase64 = currentSolution?.imageBase64

  const cropperRef = useRef<ReactCropperElement>(null)
  const handleButtonClick = () => {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper
      const croppedCanvas = cropper.getCroppedCanvas()
      const croppedImageDataUrl = croppedCanvas.toDataURL('image/jpeg')
      console.log(croppedImageDataUrl)
    }
  }

  if (!currentSolution) {
    setTimeout(() => router.push(`/create-solution/${uuid()}`))
    return
  }

  return (
    <section>
      <Cropper
        ref={cropperRef}
        src={imageBase64}
        className="w-full h-full bg-muted-foreground"
        dragMode="move"
        background={false}
        initialAspectRatio={4}
        guides={false}
        checkOrientation={false}
      />
      <Button onClick={handleButtonClick} className="absolute bottom-4 right-4">
        上传裁剪
      </Button>
    </section>
  )
}
