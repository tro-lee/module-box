import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

// 寻找最近的项目根目录（含package.json）
export function findNearestProjectRoot(filePath: string): string | null {
  let currentDir = path.dirname(filePath)

  while (currentDir !== '/') {
    const packageJsonPath = path.join(currentDir, 'package.json')

    if (fs.existsSync(packageJsonPath)) {
      return currentDir
    }

    currentDir = path.dirname(currentDir)
  }

  // 如果找到根目录都没找到,返回null
  return null
}

// 根据参数生成唯一标识符
export function generateUniqueId(...params: string[]) {
  return crypto.createHash('sha256').update(params.join('-')).digest('hex')
}
