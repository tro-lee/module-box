import type { FileContext, Module } from '../types'
import { transformDeclarationToComponent } from './declaration-to-component'

// 将文件上下文转换为模块
// 实际就是直接转换成组件
export async function transformFileContextToModule(
  context: FileContext,
) {
  const modules: Module[] = []
  for (const functionWithBaseInfo of context.functionsWithBaseInfo) {
    // 将导出声明都转换为模块，其他则忽略
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
