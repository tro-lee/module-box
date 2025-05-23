import type { AnaylzeSolutionItemTask } from '../types'
import { API_URL } from '@/lib/constants'

export async function startAnaylzeSolutionItemStream(
  anaylzeSolutionItemTask: AnaylzeSolutionItemTask,
): Promise<ReadableStream<Uint8Array>> {
  const { solutionId, imageBase64 } = anaylzeSolutionItemTask

  try {
    const url = new URL('/graph/anaylze-solution-item-stream', API_URL)
    url.searchParams.append('id', solutionId)

    const formData = new FormData()
    formData.append('img', imageBase64)
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }

    return response.body as ReadableStream<Uint8Array>
  }
  catch (error) {
    console.error('获取代码解释流数据失败:', error)
    throw error
  }
}
