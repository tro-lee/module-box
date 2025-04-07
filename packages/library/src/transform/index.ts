import type {
  FileContext,
  Module,
} from '../types'
import { GlobalComponentContext } from '../constanst'
import { scanFileContextByAutoFile } from '../scan/'
import { transformFileContextToModuleAndComponent } from './file-to-module'

// 最核心的入口函数
export async function transformFilePathsToModuleAndComponent(
  filePaths: string[],
) {
  const fileContexts: Record<string, FileContext> = {}
  for (const filePath of filePaths) {
    const fileContext = await scanFileContextByAutoFile(filePath)
    if (!fileContext)
      continue
    fileContexts[filePath] = fileContext
  }

  const resultModules: Record<string, Module> = {}
  for (const key of Object.keys(GlobalComponentContext)) {
    delete GlobalComponentContext[key]
  }

  for (const fileContext of Object.values(fileContexts)) {
    const modules = await transformFileContextToModuleAndComponent(
      fileContext,
    )
    for (const module of modules) {
      resultModules[module.componentName] = module
    }
  }

  return {
    modules: resultModules,
    components: GlobalComponentContext,
  }
}

// 对外暴露组件转声明
export * from './component-to-declaration'
