'use server'

import * as fs from 'node:fs'

// 获取某一组件文本
export async function querySourceCode(
  path: string,
  locStart: number,
  locEnd: number,
): Promise<string> {
  const code = fs.readFileSync(path, 'utf-8')
  const content = code.slice(locStart, locEnd)
  return content
}
