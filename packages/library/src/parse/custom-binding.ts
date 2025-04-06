import type { NodePath } from '@babel/core'
import type {
  BlockStatement,
  MemberExpression,
  Node,
  VariableDeclarator,
} from '@babel/types'
import type {
  Declaration,
  FileContext,
} from '../types'
import generate from '@babel/generator'
import { scanDeclarationInContext } from '../scan/context'

interface CustomBinding {
  name: string
  usedProperties: string[]
  referenceStatements: string[]
  referencePaths: NodePath<Node>[]
  initHook: Declaration | null
}

// 解析函数体
// TODO: 当前还没有做 更里的作用域
export async function parseCustomBinding(
  blockStatementWithNodePath: NodePath<BlockStatement>,
  context: FileContext,
) {
  const totalBindings: CustomBinding[] = []

  for (const [key, binding] of Object.entries(
    blockStatementWithNodePath.scope.bindings,
  )) {
    // 获取初始化函数
    let initHook: Declaration | null = null
    let hookName = ''
    binding.path.traverse({
      Identifier(path) {
        if (path.key === 'callee') {
          hookName = path.node.name
        }
      },
    })
    if (hookName) {
      initHook = await scanDeclarationInContext(hookName, context)
    }

    // 获取所有引用语句
    let referencePaths = [binding.path, ...binding.referencePaths]
      .map((referencePath) => {
        let refCurrentPath: NodePath<Node> | null = referencePath
        while (
          refCurrentPath
          && refCurrentPath.type !== 'ExpressionStatement'
          && refCurrentPath.type !== 'VariableDeclaration'
          && refCurrentPath.type !== 'JSXElement'
        ) {
          refCurrentPath = refCurrentPath.parentPath
        }
        return refCurrentPath
      })
      .filter(v => v !== null)
    let referenceStatements = referencePaths.map((path) => {
      return generate(path.node).code
    })
    referencePaths = Array.from(new Set(referencePaths))
    referenceStatements = Array.from(new Set(referenceStatements))

    // 获取Binding被用到所有属性
    let usedProperties = referencePaths
      .map((reference) => {
        // 比如 a.b
        if (reference.parentPath?.type === 'MemberExpression') {
          const memberExpression = reference.parentPath
            .node as MemberExpression
          if (memberExpression.property.type === 'Identifier') {
            return memberExpression.property.name
          }
        }

        // 比如 const {a, ...c} = b
        if (reference.parentPath?.type === 'VariableDeclarator') {
          const variableDeclarator = reference.parentPath
            .node as VariableDeclarator
          if (variableDeclarator.id.type === 'ObjectPattern') {
            return variableDeclarator.id.properties.map((property) => {
              if (
                property.type === 'ObjectProperty'
                && property.key.type === 'Identifier'
              ) {
                return property.key.name
              }
              else if (
                property.type === 'RestElement'
                && property.argument.type === 'Identifier'
              ) {
                return property.argument.name
              }
              return ''
            })
          }
        }

        return ''
      })
      .flat()
      .filter(v => v !== '')
    usedProperties = Array.from(new Set(usedProperties))

    totalBindings.push({
      name: key,
      referencePaths,
      referenceStatements,
      usedProperties,
      initHook,
    })
  }
}
