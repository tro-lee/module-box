import type { FileContext, Module } from '../types'
import { generateUniqueId } from '../utils'
import { transformDeclarationToComponent } from './declaration-to-component'

// 将文件上下文转换为模块
// 实际就是直接转换成组件
export async function transformFileContextToModule(
  context: FileContext,
) {
  const modules: Module[] = []
  const declarations = [
    ...context.functionsWithBaseInfo,
    ...context.variablesWithBaseInfo,
  ]

  const filterDeclarations = declarations.filter((declaration) => {
    return [
      'ExportSpecifier',
      'ExportAllDeclaration',
      'ExportNamedDeclaration',
      'ExportDefaultDeclaration',
    ].includes(declaration.nodePath.getStatementParent()?.type ?? '')
  })

  // 从导出语句里找（可能出现export xx或export default xx，这种非函数或变量声明的）

  // 让export default memo(A) 转换为 export const default = memo(A)
  // if (context.exportDefaultDeclarationWithNodePath) {
  //   // let identifier:
  //   // context.exportDefaultDeclarationWithNodePath.traverse({
  //   //   Identifier(path) {

  //   //   }
  //   // })
  // }

  const promises = filterDeclarations.map(async (declaration) => {
    // 将导出声明都转换为模块，其他则忽略
    const component = await transformDeclarationToComponent(
      declaration,
    )
    if (!component || component.type !== 'LocalComponent') {
      return
    }

    modules.push({
      type: 'LocalModule',
      moduleKey: generateUniqueId(component.componentKey, 'LocalModule'),
      componentKey: component.componentKey,
    })
  })

  await Promise.all(promises)

  return modules
}
