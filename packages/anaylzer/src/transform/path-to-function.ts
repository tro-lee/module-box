import generate from '@babel/generator'
import { assign } from 'lodash'
import { scanEntryFunction } from '../scan/entry-function'
import { getFunctionBaseInfo } from './utils'

export function transformFilePathsToFunction(filePath: string) {
  const functions = scanEntryFunction(filePath, '@export')

  const results = functions.map((func) => {
    if (!func) {
      return undefined
    }

    const baseInfo = getFunctionBaseInfo(func)
    const content = generate(func.functionDeclaration, {
      comments: true,
    })

    return assign(baseInfo, { functionContent: content.code })
  })

  return results
}
