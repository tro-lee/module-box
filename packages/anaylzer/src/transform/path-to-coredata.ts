import type {
  FileContext,
  Module,
} from '../types'
import { compact, flatten } from 'lodash'
import { GlobalComponentContext, GlobalHookContext } from '../constanst'
import { scanFileContext } from '../scan/file-context'
import { transformFileContextToModule } from './react-dsl/context-to-module'

// 重要的入口文件
export async function transformFilePathsToCoreData(
  filePaths: string[],
) {
  // 清空全局上下文
  for (const key of Object.keys(GlobalComponentContext)) {
    delete GlobalComponentContext[key]
  }
  for (const key of Object.keys(GlobalHookContext)) {
    delete GlobalHookContext[key]
  }

  // 分析出所有的文件上下文
  const fileContextsPromises = filePaths.map(filePath =>
    scanFileContext(filePath).then(fileContext =>
      fileContext ? { filePath, fileContext } : null,
    ),
  )
  const fileContextResults = compact(await Promise.all(fileContextsPromises))
  const fileContexts: Record<string, FileContext> = {}
  for (const result of fileContextResults) {
    fileContexts[result.filePath] = result.fileContext
  }

  // 分析出所有的模块
  const modulePromises = Object.values(fileContexts).map(fileContext =>
    transformFileContextToModule(fileContext),
  )
  const modules = flatten(await Promise.all(modulePromises))
  const resultModules: Record<string, Module> = {}
  for (const module of modules) {
    resultModules[module.moduleKey] = module
  }

  return {
    modules: resultModules,
    components: GlobalComponentContext,
    hooks: GlobalHookContext,
  }
}
