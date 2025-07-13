import type { FilterFilesOptions } from './utils'
import fs from 'node:fs'
import path from 'node:path'
import { filterFiles } from './utils'

// 获取入口文件
export async function scanEntryFilePaths(
  dirPath: string,
  options: FilterFilesOptions = {},
  headLineFlag: string = '',
): Promise<string[]> {
  const files = fs.readdirSync(dirPath, { encoding: 'utf-8', recursive: true })
  const filteredFiles = filterFiles(files, options)

  let result = []
  if (headLineFlag) {
    // 获取文件内容，判断是否包含headLineFlag
    const moduleFilesPromise = filteredFiles.map(async (file) => {
      const filePath = path.resolve(dirPath, file)
      const content = await fs.promises.readFile(filePath, 'utf-8')
      const headLines = content.split('\n').slice(0, 5).join('\n')

      if (headLines.includes(headLineFlag)) {
        return filePath
      }
    })
    result = (await Promise.all(moduleFilesPromise)).filter(
      file => file !== undefined,
    )
  }
  else {
    // 直接返回文件路径
    result = filteredFiles.map(file => path.resolve(dirPath, file))
  }

  return result
}
