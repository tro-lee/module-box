'use server'

import type { InitSolutionTask } from '../types'
import { API_URL } from '@/lib/constants'

export async function startInitSolutionTaskStream(
  initSolutionTask: InitSolutionTask,
): Promise<ReadableStream<Uint8Array>> {
  try {
    const url = new URL('/graph/init-solution-sse', API_URL)
    url.searchParams.append('id', initSolutionTask.solutionId)

    const formData = new FormData()
    formData.append('img', initSolutionTask.imageBase64)
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
