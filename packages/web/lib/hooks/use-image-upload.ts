import { useCallback, useEffect, useRef, useState } from 'react'

interface UseImageUploadProps {
  onUpload?: (url: string) => void
}

// 将文件转换为base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

export function useImageUpload({ onUpload }: UseImageUploadProps = {}) {
  const previewRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBase64, setPreviewBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleThumbnailClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (event: Pick<React.ChangeEvent<HTMLInputElement>, 'target'>) => {
      const file = event.target.files?.[0]
      if (file) {
        setFileName(file.name)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        previewRef.current = url

        try {
          const base64Data = await fileToBase64(file)
          setPreviewBase64(base64Data)
          onUpload?.(base64Data)
        }
        catch (error) {
          console.error('转换文件为base64失败:', error)
        }
      }
    },
    [onUpload],
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPreviewBase64(null)
    setFileName(null)
    previewRef.current = null
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  return {
    previewUrl,
    previewBase64,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  }
}
