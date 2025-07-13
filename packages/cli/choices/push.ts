import type { Choice } from '../types'
import path from 'node:path'
import { transformFilePathsToFunction } from '@module-toolbox/anaylzer/src/transform/path-to-function'

export default {
  name: 'Push - 推送模块',
  value: 'push',
  description: '将当前模块推送到远程仓库',
  function: () => {
    const entryFilePath = path.resolve(__dirname, './../../web/')
    console.log('搜索', entryFilePath, '下的所有文件')
    const functions = transformFilePathsToFunction(entryFilePath)
    console.log(functions)
  },
} as Choice
