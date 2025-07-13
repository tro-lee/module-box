import fs from 'node:fs'
import path from 'node:path'

interface Options {
  exclude?: string[]
  include?: string[]
}

// 获取入口文件
export async function scanEntryFilePaths(
  dirPath: string,
  options: Options = {},
  headLineFlag: string = '',
): Promise<string[]> {
  const start = performance.now()
  const files = fs.readdirSync(
    path.resolve(__dirname, dirPath),
    { encoding: 'utf-8', recursive: true },
  )

  // 只获取tsx和ts文件
  // 根据options过滤文件
  const filteredFiles = files.filter(
    (file) => {
      const basicFilter = ['.tsx', '.ts'].some(ext => file.endsWith(ext))
        && !file.includes('node_modules')
        && !file.startsWith('.')

      if (options.exclude && options.exclude.length > 0) {
        if (options.exclude.some(excludePath => file.includes(excludePath))) {
          return false
        }
      }

      if (options.include && options.include.length > 0) {
        return basicFilter
          && options.include.some(includePath => file.includes(includePath))
      }

      return basicFilter
    },
  )

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

  const end = performance.now()
  console.log(`拿到符合规则路径: ${end - start}ms`)
  return result
}
