import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 处理SSE事件流的辅助函数
export async function handleStream(
  stream: ReadableStream<Uint8Array>,
  {
    onStart = () => {},
    onEvent = (eventType: string, data: string) => {},
    onMessage = (message: string) => {},
    onFinish = () => {},
  },
): Promise<void> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()

  let buffer = ''

  try {
    onStart()
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        onFinish()
        break
      }

      const text = decoder.decode(value, { stream: true })
      onMessage(text)

      // 处理完整的SSE消息
      buffer += text
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
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
