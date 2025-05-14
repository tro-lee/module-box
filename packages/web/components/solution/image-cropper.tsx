'use client'
import type { ReactCropperElement } from 'react-cropper'
import { useSolutionManagerStore } from '@/store/solution-manager-store'
import { useRef } from 'react'
import Cropper from 'react-cropper'
import { Button } from '../ui/button'
import 'cropperjs/dist/cropper.css'

export function ImageCropper() {
  const currentSolution = useSolutionManagerStore(state => state.currentSolution)
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

  if (!imageBase64) {
    return <div className="w-full h-full bg-muted-foreground">请先上传图片</div>
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
