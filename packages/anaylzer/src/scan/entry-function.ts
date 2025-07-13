import type { FunctionDeclarationWithBaseInfo } from '../types'
import type { FilterFilesOptions } from './utils'
import fs from 'node:fs'
import path from 'node:path'
import { scanFileContext } from './file-context'
import { filterFiles } from './utils'

export async function scanEntryFunction(
  dirPath: string,
  flag: string,
  options: FilterFilesOptions = {},
) {
  const filePaths = fs.readdirSync(dirPath, { encoding: 'utf-8', recursive: true })

  const funcPromises = filterFiles(filePaths, options).map(async (filePath) => {
    const absolutePath = path.resolve(dirPath, filePath)
    const text = fs.readFileSync(absolutePath, { encoding: 'utf-8' })

    if (text.includes(flag)) {
      const fileContext = await scanFileContext(absolutePath)
      if (!fileContext) {
        return
      }
      return fileContext.functionsWithBaseInfo.filter(func =>
        func.leadingComment?.value.includes('@export'),
      )
    }
  })

  const functions = (await Promise.all(funcPromises)).filter(Boolean).flat() as FunctionDeclarationWithBaseInfo[]
  return functions
}
