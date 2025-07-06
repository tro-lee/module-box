import type { NodePath } from '@babel/traverse'
import type { ExportSpecifier, Identifier, ImportDeclaration } from '@babel/types'
import type { Declaration, FileContext } from '../types'
import path from 'node:path'
import { findNearestProjectRoot, generateUniqueId } from '../utils'

import { scanFileContextByAutoFile } from './file-context'

// 从导入声明中获取目标声明
// 用于解决导入导出问题
async function getDeclarationByImportDeclaration(
  currentImportDeclaration: ImportDeclaration,
  currentContext: FileContext,
  itemName: string,
): Promise<Declaration | null> {
  let absoluteTargetImportPath = ''

  // 判断是否使用@/，进行变量转换
  if (currentImportDeclaration.source.value.startsWith('@/')) {
    const projectRoot = findNearestProjectRoot(currentContext.path)
    if (projectRoot) {
      absoluteTargetImportPath = path.resolve(
        path.dirname(currentContext.path),
        currentImportDeclaration.source.value.replace('@/', `${projectRoot}/`),
      )
    }
  }

  // 判断是否要进行相对路径的转换
  if (currentImportDeclaration.source.value.startsWith('.')) {
    absoluteTargetImportPath = path.resolve(
      path.dirname(currentContext.path),
      currentImportDeclaration.source.value,
    )
  }

  // 若有目标文件路径，则进行扫描
  // 针对不同情况的export写法，进行处理
  if (absoluteTargetImportPath) {
    const targetContext = await scanFileContextByAutoFile(
      absoluteTargetImportPath,
    )
    if (!targetContext) {
      console.warn(`[${absoluteTargetImportPath}] 不存在`)
      return null
    }

    // ============================================
    // 处理默认导出 export default xxx
    // 例如export default a 则直接从本上下文获取
    // 例如export default observer(a) 则直接从上下文中获取a
    // ============================================
    if (
      currentImportDeclaration.specifiers.some(
        specifier =>
          specifier.type === 'ImportDefaultSpecifier'
          && specifier.local.name === itemName,
      )
    ) {
      if (!targetContext.exportDefaultDeclarationWithNodePath) {
        console.warn(`存在异常导出问题`)
        return null
      }

      let targetIdentifier: Identifier | null = null
      const targetDeclaration: Declaration | null = null
      targetContext.exportDefaultDeclarationWithNodePath.traverse({
        // 解析第一个函数参数
        Identifier(path) {
          if (path.listKey === 'arguments' && path.key === 0) {
            // 解决export default B(A)
            targetIdentifier = path.node
          }
          else if (path.key === 'declaration') {
            // 解决export default A;
            targetIdentifier = path.node
          }
          else if (path.parentPath.type === 'FunctionDeclaration') {
            // 解决export default A() {}
            targetIdentifier = path.node
          }
          // else if (path.parentPath.type === 'ClassDeclaration') {
          //   // 解决export default class A {}
          //   targetDeclaration = {
          //     type: 'TodoDeclaration',
          //     id: path.node,
          //     nodePath: path.parentPath,
          //     filePath: targetContext.path,
          //     context: targetContext,
          //   }
          // }
        },
      })

      if (targetDeclaration) {
        return targetDeclaration
      }

      if (!targetDeclaration && targetIdentifier) {
        return await scanDeclarationInContext(
          (targetIdentifier as Identifier).name,
          targetContext,
        )
      }
    }

    // ============================================
    // 处理类似export { a } 的声明
    // 判断下当前导出声明中 是否提及itemName即可
    // ============================================
    let targetExportSpecifier: ExportSpecifier | null = null
    targetContext.exportNamedDeclarationsWithNodePath.forEach((item) => {
      item.traverse({
        ExportSpecifier(path) {
          if (
            path.node.local.name === itemName
            || (path.node.exported.type === 'Identifier'
              && path.node.exported.name === itemName)
          ) {
            targetExportSpecifier = path.node
          }
        },
        // 将export function a() {} 转换为 export { a }
        FunctionDeclaration(path) {
          if (path.node.id?.name === itemName) {
            targetExportSpecifier = {
              type: 'ExportSpecifier',
              local: path.node.id,
              exported: path.node.id,
            }
          }
        },
        // 将export interface a {} 转换为 export { a }
        TSInterfaceDeclaration(path) {
          if (path.node.id?.name === itemName) {
            targetExportSpecifier = {
              type: 'ExportSpecifier',
              local: path.node.id,
              exported: path.node.id,
            }
          }
        },
        // 将export const a = b 转化为 export { b as a }
        VariableDeclaration(path) {
          let variableDeclaratorId: Identifier | null = null
          let variableDeclaratorInit: Identifier | null = null
          path.traverse({
            Identifier(path) {
              if (
                path.parentPath.type === 'VariableDeclarator'
                && path.key === 'id'
                && path.node.name === itemName
              ) {
                variableDeclaratorId = path.node
              }

              // export const a = b情况
              if (
                path.parentPath.type === 'VariableDeclarator'
                && path.key === 'init'
              ) {
                variableDeclaratorInit = path.node
              }

              // export const a = call(b)情况
              // 这种情况init和id是同一个，直接使用scan查找
              if (
                path.parentPath.type === 'CallExpression'
                && path.parentPath.key === 'init'
                && path.key === 'callee'
              ) {
                variableDeclaratorInit = variableDeclaratorId
              }
            },
          })

          if (variableDeclaratorId && variableDeclaratorInit) {
            targetExportSpecifier = {
              type: 'ExportSpecifier',
              local: variableDeclaratorId,
              exported: variableDeclaratorInit,
            }
          }
        },
      })
    })

    if (targetExportSpecifier) {
      const exportedName = (targetExportSpecifier as ExportSpecifier).exported
      const actualExportName
        = exportedName.type === 'Identifier' ? exportedName.name : itemName
      const declaration = await scanDeclarationInContext(
        actualExportName,
        targetContext,
      )
      return declaration || null
    }

    // ============================================
    // 处理类似export * from '...' 的声明
    // 遍历所有export * from '...' 的声明，直到找到目标上下文为止
    // ============================================
    for (const exportAllDeclaration of targetContext.exportAllDeclarationsWithNodePath) {
      const sourceValue = exportAllDeclaration.node.source.value
      const resolvedPath = path.resolve(
        path.dirname(targetContext.path),
        sourceValue,
      )

      const newContext = await scanFileContextByAutoFile(resolvedPath)
      if (newContext) {
        const result = await scanDeclarationInContext(itemName, newContext)
        if (result) {
          return result
        }
      }
    }

    console.warn(
      `[${currentContext.path}] 的 ${targetContext.path} 无法解析导入声明 ${itemName}`,
    )
  }

  // 若不是导入本地文件，则说明是导入node_modules
  return {
    type: 'NodeModuleImportDeclaration',
    id: {
      type: 'Identifier',
      name: itemName,
    },
    filePath: currentImportDeclaration.source.value,
    encryptedKey: generateUniqueId(itemName, currentImportDeclaration.source.value, 'NodeModuleImportDeclaration'),
  }
}

// 缓存已查询过的声明，避免重复查询
const declarationCache = new Map<string, Declaration | null>()

// 获取声明在一个上下文中
// 如果没有，则直接报错
export async function scanDeclarationInContext(
  itemName: string,
  currentContext: FileContext,
): Promise<Declaration | null> {
  const cacheKey = `${currentContext.path}-${itemName}`
  const cachedDeclaration = declarationCache.get(cacheKey)
  if (cachedDeclaration) {
    return cachedDeclaration
  }

  // 从当前文件的变量声明 函数声明/接口声明中查找目标声明
  const declarations = [
    ...currentContext.variablesWithBaseInfo,
    ...currentContext.interfacesWithBaseInfo,
    ...currentContext.functionsWithBaseInfo,
  ]
  const item = declarations.find(item => item.id.name === itemName)
  if (item) {
    declarationCache.set(cacheKey, item)
    return item
  }

  // 从当前文件的导入声明中查找目标声明
  let targetImportDeclaration: ImportDeclaration | null = null
  currentContext.importDeclarationsWithNodePath.forEach((importDeclaration) => {
    importDeclaration.traverse({
      Identifier(path: NodePath<Identifier>) {
        if (path.node.name === itemName) {
          targetImportDeclaration = importDeclaration.node
        }
      },
    })
  })

  // 递归获取
  const declaration = targetImportDeclaration
    ? await getDeclarationByImportDeclaration(
      targetImportDeclaration,
      currentContext,
      itemName,
    )
    : null

  if (declaration) {
    declarationCache.set(cacheKey, declaration)
  }
  return declaration
}
