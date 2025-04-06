import type { FileContext, Module } from '../types'
import { transformDeclarationToComponent } from './declaration-and-component'

// 将文件上下文转换为模块和组件
export async function transformFileContextToModuleAndComponent(
  context: FileContext,
) {
  // 载入全局组件上下文

  const modules: Module[] = []
  for (const functionWithBaseInfo of context.functionsWithBaseInfo) {
    if (
      functionWithBaseInfo.nodePath.parent.type !== 'ExportSpecifier'
      && functionWithBaseInfo.nodePath.parent.type !== 'ExportAllDeclaration'
      && functionWithBaseInfo.nodePath.parent.type !== 'ExportNamedDeclaration'
      && functionWithBaseInfo.nodePath.parent.type !== 'ExportDefaultDeclaration'
    ) {
      continue
    }

    const component = await transformDeclarationToComponent(
      functionWithBaseInfo,
    )
    if (!component || component.type !== 'LocalComponent') {
      continue
    }

    modules.push({
      type: 'LocalModule',
      key: `Module-${component.componentKey}`,
      componentFilePath: component.componentFilePath,
      componentName: component.componentName,
      componentKey: component.componentKey,
    })
  }

  return modules
}
