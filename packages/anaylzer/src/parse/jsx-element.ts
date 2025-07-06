// 解析JSX元素

import type { NodePath } from '@babel/core'
import type {
  JSXElement,
} from '@babel/types'
import type { ComponentJSXElement, FileContext } from '../types'

import { scanDeclarationInContext } from '../scan/declaration'

// 只解析组件函数
export async function parseComponentJSXElement(
  jsxElementWithNodePath: NodePath<JSXElement>,
  currentContext: FileContext,
): Promise<ComponentJSXElement | undefined> {
  let elementName: string | undefined
  const openingElement = jsxElementWithNodePath.node.openingElement

  if (openingElement.name.type === 'JSXIdentifier' && /^[A-Z]/.test(openingElement.name.name)) {
    elementName = openingElement.name.name
  }
  else {
    console.warn(
      `在解析JSXElement语句时，未找到elementName ${openingElement.name} ${currentContext.path}`,
    )
    return
  }

  const elementDeclaration = await scanDeclarationInContext(
    elementName,
    currentContext,
  )
  if (!elementDeclaration) {
    console.warn(
      `在解析JSXElement语句时，未找到elementDeclaration ${elementName} ${currentContext.path}`,
    )
    return
  }

  return {
    elementName,
    componentKey: elementDeclaration.encryptedKey,
  }
}
