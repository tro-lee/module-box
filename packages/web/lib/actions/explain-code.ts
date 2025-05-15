'use server'

import { API_URL } from '@/lib/constants'

export async function getExplainCodeStream(
  path: string,
  locStart: number,
  locEnd: number,
): Promise<ReadableStream<Uint8Array>> {
  try {
    const url = new URL('/graph/explain-code-stream', API_URL)
    url.searchParams.append('filepath', path)
    url.searchParams.append('locStart', locStart.toString())
    url.searchParams.append('locEnd', locEnd.toString())

    const response = await fetch(url)

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
