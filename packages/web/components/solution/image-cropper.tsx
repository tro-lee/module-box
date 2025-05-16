'use client'
import type { ReactCropperElement } from 'react-cropper'
import { useSolutionManager } from '@/lib/hooks/use-solution-manager'
import { useAtomValue } from 'jotai'
import { useParams } from 'next/navigation'
import { useRef } from 'react'
import Cropper from 'react-cropper'
import { solutionsAtom } from '../../lib/atoms/solution'
import { Button } from '../ui/button'
import 'cropperjs/dist/cropper.css'

export function ImageCropper() {
  const params = useParams<{ id: string }>()
  const { addSolutionItem } = useSolutionManager()
  const solutions = useAtomValue(solutionsAtom)
  const currentSolution = solutions[params.id]

  const cropperRef = useRef<ReactCropperElement>(null)
  const handleButtonClick = () => {
    if (cropperRef.current) {
      const cropper = cropperRef.current.cropper
      const croppedCanvas = cropper.getCroppedCanvas()
      const croppedImageDataUrl = croppedCanvas.toDataURL('image/jpeg')
      addSolutionItem(params.id, { imageBase64: croppedImageDataUrl })
    }
  }

  if (!currentSolution) {
    return
  }

  return (
    <>
      <Cropper
        ref={cropperRef}
        src={currentSolution?.imageBase64 || ''}
        className="w-full h-full bg-sidebar-foreground"
        dragMode="move"
        background={false}
        initialAspectRatio={4}
        guides={false}
        checkOrientation={false}
      />
      <Button
        variant="secondary"
        className="absolute bottom-4 right-4"
        onClick={handleButtonClick}
      >
        上传裁切
      </Button>
    </>
  )
}
