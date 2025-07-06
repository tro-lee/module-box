import type { NodePath } from '@babel/core'
import type { ArrowFunctionExpression, BlockStatement, Expression, Identifier, JSXElement } from '@babel/types'
import type { Declaration, FileContext } from '../types'

// 将箭头函数转换为函数声明
export function transformVariableToArrowFunction(
  path: NodePath<ArrowFunctionExpression>,
  declaration: Extract<Declaration, { type: 'VariableDeclaratorWithBaseInfo' }>,
): FileContext['functionsWithBaseInfo'][number] | undefined {
  const {
    locStart,
    locEnd,
    filePath,
    context,
    encryptedKey,
  } = declaration

  // 保证解析是 解析的顶级域的初始化箭头函数
  // 然后伪装成FunctionDeclaration，我们不对箭头函数和函数进行细微区分
  const arrowFunction = path.node
  const leadingComments = path.parent?.leadingComments
  const leadingComment = leadingComments?.at(-1)

  // 语法糖处理
  // () => AA 转换为 { return AA }
  if (arrowFunction.body.type !== 'BlockStatement') {
    arrowFunction.body = {
      type: 'BlockStatement',
      body: [
        {
          type: 'ExpressionStatement',
          expression: arrowFunction.body as Expression,
        },
      ],
      directives: [],
    }
  }

  const jsxElementsWithNodePath: NodePath<JSXElement>[] = []
  let blockStateWithNodePath: NodePath<BlockStatement> | undefined
  path.traverse({
    JSXElement(path: NodePath<JSXElement>) {
      jsxElementsWithNodePath.push(path)
    },
    BlockStatement(path: NodePath<BlockStatement>) {
      if (path.container === arrowFunction) {
        blockStateWithNodePath = path
      }
    },
  })

  const id = {
    type: 'Identifier',
    name: '',
  } as Identifier

  return {
    type: 'FunctionDeclarationWithBaseInfo',
    locStart,
    locEnd,
    isArrowFunction: true,
    nodePath: path,
    id,
    encryptedKey,
    leadingComment,
    filePath,
    context,
    functionDeclaration: {
      id,
      body: arrowFunction.body,
      params: arrowFunction.params,
    },
    jsxElementsWithNodePath,
    blockStateWithNodePath: blockStateWithNodePath!,
  }
}
