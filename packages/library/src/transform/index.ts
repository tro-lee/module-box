import type {
  FileContext,
  Module,
} from '../types'
import { GlobalComponentContext, GlobalHookContext } from '../constanst'
import { scanFileContextByAutoFile } from '../scan/'
import { transformFileContextToModule } from './file-to-module'

// 最核心的入口函数
export async function transformFilePathsToModuleAndComponent(
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

// 对外暴露组件转声明
export * from './component-to-declaration'
