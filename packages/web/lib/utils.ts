import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 处理SSE事件流的辅助函数
export async function handleSSE(
  stream: ReadableStream<Uint8Array>,
  {
    onEvent = (eventType: string, data: string) => {},
    onFinish = () => {},
  },
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()

  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        onFinish()
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // 处理完整的SSE消息
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        // 解析SSE消息
        const eventMatch = line.match(/^event: (.+)$/m)
        const dataMatch = line.match(/^data: (.+)$/m)

        const eventType = eventMatch ? eventMatch[1] : 'message'
        const data = dataMatch ? dataMatch[1] : ''
        onEvent(eventType, data)
      }
    }

    // 处理最后可能的残留数据
    if (buffer.trim()) {
      const eventMatch = buffer.match(/^event: (.+)$/m)
      const dataMatch = buffer.match(/^data: (.+)$/m)

      const eventType = eventMatch ? eventMatch[1] : 'message'
      const data = dataMatch ? dataMatch[1] : buffer
      onEvent(eventType, data)
    }
  }
  catch (error) {
    console.error('处理SSE流时出错:', error)
    throw error
  }
  finally {
    reader.releaseLock()
  }
}

export async function handleStream(stream: ReadableStream<Uint8Array>, {
  onMessage = (message: string) => {},
  onFinish = () => {},
}) {
  const reader = stream.getReader()

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        onFinish()
        break
      }

      const decoder = new TextDecoder()
      const text = decoder.decode(value, { stream: true })
      onMessage(text)
    }
  }
  catch (error) {
    console.error('处理流时出错:', error)
  }
  finally {
    reader.releaseLock()
  }
}
