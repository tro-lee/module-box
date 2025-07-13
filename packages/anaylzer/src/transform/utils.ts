import type { CustomTypeAnnotation, Declaration } from '../types'
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

interface FunctionBaseInfo {
  functionName: string
  functionDescription: string
  functionParams: CustomTypeAnnotation[]
}

export async function getFunctionBaseInfo(
  declaration: Declaration & { type: 'FunctionDeclarationWithBaseInfo' },
): Promise<FunctionBaseInfo> {
  const {
    functionDeclaration,
    leadingComment,
    context,
  } = declaration

  // 收集函数的名称
  const functionName = functionDeclaration.id.name

  // 收集函数的注释
  let functionDescription = ''
  for (const item of parseComment(`/*${leadingComment?.value}*/`)) {
    item.tags.forEach((tag) => {
      if (tag.name === 'description') {
        functionDescription = tag.name
      }
    })
  }

  // 收集函数参数的类型注解
  const functionParams = (
    await Promise.all(
      functionDeclaration.params
        .filter(param => param.type === 'Identifier')
        .map(param =>
          parseCustomTypeAnnotation(param.typeAnnotation, context),
        ),
    )
  ).filter(item => item !== undefined)

  return {
    functionName,
    functionDescription,
    functionParams,
  }
}
