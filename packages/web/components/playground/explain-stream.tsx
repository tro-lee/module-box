'use client'

import { useEffect, useState } from 'react'

// 解析 SSE 事件数据流
interface ExplainStreamProps {
  stream: ReadableStream<Uint8Array>
}

export function ExplainStreamComponent({ stream }: ExplainStreamProps) {
  const [content, setContent] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'started' | 'streaming' | 'completed' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!stream)
      return

    const processStream = async () => {
      try {
        const reader = stream.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break

          const text = decoder.decode(value, { stream: true })
          // 解析 SSE 消息格式 (data: {...}\n\n)
          const events = text.split('\n\n').filter(Boolean)

          for (const event of events) {
            if (!event.startsWith('data: '))
              continue

            try {
              const jsonData = JSON.parse(event.substring(6))

              if (jsonData.status === 'started') {
                setStatus('started')
              }
              else if (jsonData.status === 'streaming' && jsonData.content) {
                setStatus('streaming')
                setContent(prev => prev + jsonData.content)
              }
              else if (jsonData.status === 'completed') {
                setStatus('completed')
              }
              else if (jsonData.status === 'error') {
                setStatus('error')
                setError(jsonData.message || '解析过程中发生错误')
              }
            }
            catch (e) {
              console.error('解析 SSE 消息失败:', e, event)
            }
          }
        }
      }
      catch (err) {
        console.error('处理流失败:', err)
        setStatus('error')
        setError(err instanceof Error ? err.message : '未知错误')
      }
    }

    processStream()

    return () => {
      // 此处无法直接取消 stream，但在组件卸载时，
      // 我们已经停止处理数据
    }
  }, [stream])

  if (status === 'idle') {
    return <div className="p-4">等待开始分析...</div>
  }

  if (status === 'started') {
    return <div className="p-4">正在开始分析代码...</div>
  }

  if (status === 'error') {
    return (
      <div className="p-4 text-red-500">
        错误:
        {error || '未知错误'}
      </div>
    )
  }

  return (
    <div className="p-4">
      {status === 'streaming' && (
        <div className="flex items-center mb-2">
          <div className="w-2 h-2 mr-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm text-gray-500">分析中...</span>
        </div>
      )}

      {status === 'completed' && (
        <div className="flex items-center mb-2">
          <div className="w-2 h-2 mr-2 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-500">分析完成</span>
        </div>
      )}

      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  )
}
