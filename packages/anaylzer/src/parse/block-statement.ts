import type { NodePath } from '@babel/core'
import type {
  BlockStatement,
} from '@babel/types'
import type {
  FileContext,
  FunctionDeclarationWithBaseInfo,
  VariableDeclaratorWithBaseInfo,
} from '../types'
import { scanDeclarationInContext } from '../scan/declaration'

// 解析函数体
export function parseBlockStatement(
  blockStatementWithNodePath: NodePath<BlockStatement>,
  context: FileContext,
): { functionDeclarations: FunctionDeclarationWithBaseInfo[], variableDeclarations: VariableDeclaratorWithBaseInfo[] } {
  const functionDeclarations: FunctionDeclarationWithBaseInfo[] = []
  const variableDeclarations: VariableDeclaratorWithBaseInfo[] = []

  blockStatementWithNodePath.traverse({
    Identifier(path) {
      console.log(path)
    },
  })

  for (const [key, binding] of Object.entries(
    blockStatementWithNodePath.scope.bindings,
  )) {
    // 获取初始化函数
    let initCalleeName: string | null = null
    binding.path.traverse({
      Identifier(path) {
        if (path.key === 'callee') {
          initCalleeName = path.node.name
        }
      },
    })

    if (initCalleeName) {
      const initCalleeDeclaration = scanDeclarationInContext(initCalleeName, context)
      if (initCalleeDeclaration?.type === 'FunctionDeclarationWithBaseInfo') {
        functionDeclarations.push(initCalleeDeclaration)
      }
      else if (initCalleeDeclaration?.type === 'VariableDeclaratorWithBaseInfo') {
        variableDeclarations.push(initCalleeDeclaration)
      }
    }

    // // 获取所有引用语句
    // let referencePaths = [binding.path, ...binding.referencePaths]
    //   .map((referencePath) => {
    //     let refCurrentPath: NodePath<Node> | null = referencePath
    //     while (
    //       refCurrentPath
    //       && refCurrentPath.type !== 'ExpressionStatement'
    //       && refCurrentPath.type !== 'VariableDeclaration'
    //       && refCurrentPath.type !== 'JSXElement'
    //     ) {
    //       refCurrentPath = refCurrentPath.parentPath
    //     }
    //     return refCurrentPath
    //   })
    //   .filter(v => v !== null)
    // referencePaths = Array.from(new Set(referencePaths))

    // let referenceStatements = referencePaths.map((path) => {
    //   return generate(path.node).code
    // })
    // referenceStatements = Array.from(new Set(referenceStatements))

    // // 获取Binding被用到所有属性
    // let usedProperties = referencePaths
    //   .map((reference) => {
    //     // 比如 a.b
    //     if (reference.parentPath?.type === 'MemberExpression') {
    //       const memberExpression = reference.parentPath
    //         .node as MemberExpression
    //       if (memberExpression.property.type === 'Identifier') {
    //         return memberExpression.property.name
    //       }
    //     }

    //     // 比如 const {a, ...c} = b
    //     if (reference.parentPath?.type === 'VariableDeclarator') {
    //       const variableDeclarator = reference.parentPath
    //         .node as VariableDeclarator
    //       if (variableDeclarator.id.type === 'ObjectPattern') {
    //         return variableDeclarator.id.properties.map((property) => {
    //           if (
    //             property.type === 'ObjectProperty'
    //             && property.key.type === 'Identifier'
    //           ) {
    //             return property.key.name
    //           }
    //           else if (
    //             property.type === 'RestElement'
    //             && property.argument.type === 'Identifier'
    //           ) {
    //             return property.argument.name
    //           }
    //           return ''
    //         })
    //       }
    //     }

    //     return ''
    //   })
    //   .flat()
    //   .filter(v => v !== '')
    // usedProperties = Array.from(new Set(usedProperties))

    // totalBindings.push({
    //   name: key,
    //   referencePaths,
    //   referenceStatements,
    //   usedProperties,
    //   initCalleeDeclaration,
    // })
  }

  return {
    functionDeclarations,
    variableDeclarations,
  }
}
