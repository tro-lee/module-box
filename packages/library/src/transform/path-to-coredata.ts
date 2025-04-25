import type {
  FileContext,
  Module,
} from '../types'
import { GlobalComponentContext, GlobalHookContext } from '../constanst'
import { scanFileContextByAutoFile } from '../scan'
import { transformFileContextToModule } from './context-to-module'

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

  // 存入文件上下文
  const fileContexts: Record<string, FileContext> = {}
  for (const filePath of filePaths) {
    const fileContext = await scanFileContextByAutoFile(filePath)
    if (!fileContext)
      continue
    fileContexts[filePath] = fileContext
  }

  // 转换为模块
  const resultModules: Record<string, Module> = {}
  for (const fileContext of Object.values(fileContexts)) {
    const modules = await transformFileContextToModule(
      fileContext,
    )
    for (const module of modules) {
      resultModules[module.componentName] = module
    }
  }

  return {
    modules: resultModules,
    components: GlobalComponentContext,
    hooks: GlobalHookContext,
  }
}
