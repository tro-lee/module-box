import { GlobalComponentContext, GlobalHookContext } from '../constanst'
import { scanFileContext } from '../scan/file-context'
import { transformFileContextToModule } from './react-dsl/context-to-module'

// 重要的入口文件
export async function transformFilePathsToModule(filePath: string) {
  // 清空全局上下文
  for (const key of Object.keys(GlobalComponentContext)) {
    delete GlobalComponentContext[key]
  }
  for (const key of Object.keys(GlobalHookContext)) {
    delete GlobalHookContext[key]
  }

  // 分析出所有的文件上下文
  const fileContext = await scanFileContext(filePath)
  if (!fileContext) {
    return {
      modules: [],
      components: [],
      hooks: [],
    }
  }

  const modules = await transformFileContextToModule(fileContext)
  return {
    modules,
    components: GlobalComponentContext,
    hooks: GlobalHookContext,
  }
}
