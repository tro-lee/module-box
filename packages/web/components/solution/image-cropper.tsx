'use client'
import type { ReactCropperElement } from 'react-cropper'
import { useAtomValue } from 'jotai'
import { useParams, useRouter } from 'next/navigation'
import { useRef } from 'react'
import Cropper from 'react-cropper'
import { v4 as uuidv4 } from 'uuid'
import { solutionsAtom } from '../../lib/atoms/solution'
import 'cropperjs/dist/cropper.css'

export function ImageCropper() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const solutions = useAtomValue(solutionsAtom)
  const currentSolution = solutions[params.id]

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
    setTimeout(() => router.push(`/create-solution/${uuidv4()}`))
    return
  }

  return (
    <Cropper
      ref={cropperRef}
      src={currentSolution?.imageBase64}
      className="w-full h-full bg-sidebar-foreground"
      dragMode="move"
      background={false}
      initialAspectRatio={4}
      guides={false}
      checkOrientation={false}
    />
  )
}
