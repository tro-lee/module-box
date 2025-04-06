// 解析JSX元素

import type { NodePath } from '@babel/core'
import type {
  JSXElement,
} from '@babel/types'
import type { ComponentJSXElement, FileContext } from '../types'

import { scanDeclarationInContext } from '../scan/context'

// 只解析组件函数
export async function parseComponentJSXElement(
  jsxElementWithNodePath: NodePath<JSXElement>,
  currentContext: FileContext,
): Promise<ComponentJSXElement | undefined> {
  let elementName: string | undefined

  jsxElementWithNodePath.find((path) => {
    if (path.isJSXElement() && path.node.openingElement.name.type === 'JSXIdentifier' && /^[A-Z]/.test(path.node.openingElement.name.name)) {
      elementName = path.node.openingElement.name.name
      return true
    }
    return false
  })

  if (!elementName) {
    console.warn(
      `在解析JSXElement语句时，未找到elementName ${jsxElementWithNodePath.node.openingElement.name} ${currentContext.path}`,
    )
    return undefined
  }

  const elementDeclaration = await scanDeclarationInContext(
    elementName,
    currentContext,
  )

  if (!elementDeclaration) {
    console.warn(
      `在解析JSXElement语句时，未找到elementDeclaration ${elementName} ${currentContext.path}`,
    )
    return undefined
  }

  return {
    elementName,
    componentName: elementDeclaration.id.name,
    componentFilePath: elementDeclaration.filePath,
    componentKey: `${elementDeclaration.id.name}-${elementDeclaration.filePath}`,
  }
}
