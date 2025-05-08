'use server'

import { API_URL } from '@/lib/constants'

// 使用 SSE 流式获取代码解释
export function fetchExplainCodeStream(
  path: string,
  locStart: number,
  locEnd: number,
): ReadableStream<Uint8Array> {
  const url = new URL(`${API_URL}/explain-code-by-location`)
  url.searchParams.append('filepath', path)
  url.searchParams.append('locStart', locStart.toString())
  url.searchParams.append('locEnd', locEnd.toString())

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(url)

        if (!response.ok) {
          const error = await response.text()
          controller.error(new Error(`请求失败: ${error}`))
          return
        }

        if (!response.body) {
          controller.error(new Error('响应没有数据流'))
          return
        }

        const reader = response.body.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break
          controller.enqueue(value)
        }

        controller.close()
      }
      catch (error) {
        controller.error(error)
      }
    },
  })

  return stream
}
