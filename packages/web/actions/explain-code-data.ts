'use server'

import { API_URL } from '@/lib/constants'

/**
 * 获取代码解释的流式数据
 * @param path - 文件路径
 * @param locStart - 代码起始位置
 * @param locEnd - 代码结束位置
 * @returns 返回一个ReadableStream用于流式接收AI生成的代码解释
 */
export async function fetchExplainCodeStreamData(
  path: string,
  locStart: number,
  locEnd: number,
): Promise<ReadableStream<Uint8Array>> {
  try {
    const response = await fetch(
      `${API_URL}/explain-code-by-location-stream?filepath=${path}&locStart=${locStart}&locEnd=${locEnd}`,
      {
        method: 'GET',
      },
    )

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
