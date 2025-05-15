'use client'
import type { ReactCropperElement } from 'react-cropper'
import { useAtomValue } from 'jotai'
import { useParams, useRouter } from 'next/navigation'
import { useRef } from 'react'
import Cropper from 'react-cropper'
import { v4 as uuid } from 'uuid'
import { solutionsAtom } from '../../lib/atoms/solution'
import { Button } from '../ui/button'
import 'cropperjs/dist/cropper.css'

export function ImageCropper() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const solutions = useAtomValue(solutionsAtom)
  const currentSolution = solutions?.[params.id]

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
        src={currentSolution.imageBase64}
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
