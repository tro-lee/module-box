import type {
  Component,
  FileContext,
  Module,
} from '../types'
import { scanAstByFileWithAutoExtension } from '../scan/'
import { transformFileContextToModuleAndComponent } from './file-to-module'

export const globalComponentContext: Record<string, Component> = {}

// 将文件路径列表转换为模块和组件
export async function transformFilePathsToModuleAndComponent(
  filePaths: string[],
) {
  const fileContexts: Record<string, FileContext> = {}
  for (const filePath of filePaths) {
    const fileContext = await scanAstByFileWithAutoExtension(filePath)
    if (!fileContext)
      continue
    fileContexts[filePath] = fileContext
  }

  const resultModules: Record<string, Module> = {}
  for (const key of Object.keys(globalComponentContext)) {
    delete globalComponentContext[key]
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
    components: globalComponentContext,
  }
}
