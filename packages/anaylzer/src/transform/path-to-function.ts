import { scanEntryFunction } from '../scan/entry-function'

export async function transformFilePathsToFunction(filePath: string) {
  const functions = await scanEntryFunction(filePath, '@export')
  return functions
}
