import { assign } from 'lodash'
import { parseBlockStatement } from '../parse/block-statement'
import { scanEntryFunction } from '../scan/entry-function'
import { getFunctionBaseInfo } from './utils'

export function transformFilePathsToFunction(filePath: string) {
  const functions = scanEntryFunction(filePath, '@export')

  const results = functions.map((func) => {
    if (func) {
      const baseInfo = getFunctionBaseInfo(func)
      const parseResult = parseBlockStatement(func.blockStateWithNodePath, func.context)

      return assign(baseInfo, parseResult)
    }

    return undefined
  })

  return results
}
