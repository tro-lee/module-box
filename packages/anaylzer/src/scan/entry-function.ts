import type { FilterFilesOptions } from './utils'
import fs from 'node:fs'
import path from 'node:path'
import { scanFileContext } from './file-context'
import { filterFiles } from './utils'

export function scanEntryFunction(
  dirPath: string,
  flag: string,
  options: FilterFilesOptions = {},
) {
  const filePaths = fs.readdirSync(dirPath, { encoding: 'utf-8', recursive: true })

  return filterFiles(filePaths, options).map((filePath) => {
    const absolutePath = path.resolve(dirPath, filePath)
    const text = fs.readFileSync(absolutePath, { encoding: 'utf-8' })

    if (text.includes(flag)) {
      const fileContext = scanFileContext(absolutePath)
      return fileContext?.functionsWithBaseInfo.filter(func =>
        func.leadingComment?.value.includes('@export'),
      )
    }

    return undefined
  }).filter(Boolean).flat()
}
