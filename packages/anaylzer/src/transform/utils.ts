import type { CustomTypeAnnotation, Declaration, FunctionDeclarationWithBaseInfo } from '../types'
import { parse as parseComment } from 'comment-parser'
import { parseCustomTypeAnnotation } from '../parse/type-annotation'

export function isHookFunction(
  declaration: Declaration,
): boolean {
  if (declaration.type !== 'FunctionDeclarationWithBaseInfo') {
    return false
  }

  return declaration.functionDeclaration.id.name.startsWith('use')
}

export function isJsxComponent(
  declaration: Declaration,
): boolean {
  if (declaration.type !== 'FunctionDeclarationWithBaseInfo') {
    return false
  }

  return declaration.jsxElementsWithNodePath.length > 0
}

export interface FunctionBaseInfo {
  functionName: string
  functionComment: { [key: string]: string }
  functionDescription: string
  functionParams: CustomTypeAnnotation[]
}

export function getFunctionBaseInfo(
  declaration: FunctionDeclarationWithBaseInfo,
): FunctionBaseInfo {
  const {
    functionDeclaration,
    leadingComment,
    context,
  } = declaration

  const functionName = functionDeclaration.id.name
  const functionComment: { [key: string]: string } = {}

  for (const item of parseComment(`/*${leadingComment?.value}*/`)) {
    item.tags.forEach((tag) => {
      functionComment[tag.tag] = tag.name
    })
  }

  // 收集函数参数的类型注解
  const functionParams
    = functionDeclaration.params
      .filter(param => param.type === 'Identifier')
      .map(param =>
        parseCustomTypeAnnotation(param.typeAnnotation, context),
      )
      .filter(item => item !== undefined)

  return {
    functionName,
    functionComment,
    functionDescription: functionComment.description ?? '',
    functionParams,
  }
}
