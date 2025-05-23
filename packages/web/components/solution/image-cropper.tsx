'use client'
import type { ReactCropperElement } from 'react-cropper'
import { useSolutionManager } from '@/lib/hooks/use-solution-manager'
import { useAnaylzeSolutionItemTask } from '@/lib/hooks/use-task'
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
  const { startTask, addTask } = useAnaylzeSolutionItemTask()
  const solutions = useAtomValue(solutionsAtom)
  const currentSolution = solutions[params.id]

  const cropperRef = useRef<ReactCropperElement>(null)
  const handleButtonClick = () => {
    if (cropperRef.current) {
      const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas()
      const croppedImageDataUrl = croppedCanvas.toDataURL('image/jpeg')

      const solutionItem = addSolutionItem(params.id, { imageBase64: croppedImageDataUrl })
      const task = addTask(solutionItem)
      startTask(task)
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
        分析裁剪
      </Button>
    </>
  )
}
