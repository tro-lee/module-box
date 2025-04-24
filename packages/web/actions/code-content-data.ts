'use server'

import { API_URL } from '@/lib/constants'

// 获取某一组件文本
export async function fetchCodeContentData(
  path: string,
  locStart: number,
  locEnd: number,
): Promise<string> {
  try {
    const response = await fetch(
      `${API_URL}/code-by-location?filepath=${path}&locStart=${locStart}&locEnd=${locEnd}`,
    )
    const data = await response.json()

    if (data.status === 'success') {
      return data.data as string
    }
  }
  catch (error) {
    console.error(error)
  }

  return '未找到文本'
}
