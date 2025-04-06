import type { NodePath } from '@babel/core'
import type { ArrowFunctionExpression, JSXElement } from '@babel/types'
import type {
  Component,
  ComponentJSXElement,
  Declaration,
} from '../types'
import { parse as parseComment } from 'comment-parser'
import { globalComponentContext } from '.'
import {
  parseComponentJSXElement,
  parseCustomBinding,
  parseCustomTypeAnnotation,
} from '../parse/'
import { scanAstByFileWithAutoExtension } from '../scan/'
import { scanDeclarationInContext } from '../scan/context'
import { transformArrowFunctionToFunctionDeclaration } from './function-declaration-to-custom-declaration'

// 将组件转换为声明语句
// 注意：是直接生成新的声明语句
export async function transformComponentToDeclaration(
  component: Component,
): Promise<Declaration | undefined> {
  if (component.type === 'LocalComponent') {
    const fileContext = await scanAstByFileWithAutoExtension(
      component.componentFilePath,
    )

    const functionDeclaration = fileContext?.functionsWithBaseInfo.find(
      item => item.functionDeclaration.id.name === component.componentName,
    )

    return functionDeclaration
  }

  if (component.type === 'NodeComponent') {
    return {
      type: 'NodeModuleImportDeclaration',
      id: {
        name: component.componentName,
        type: 'Identifier',
      },
      filePath: component.packageName,
    }
  }
}

// HOC白名单配置
const HOC_WHITELIST: Record<string, { paramIndex: number }> = {
  forwardRef: {
    paramIndex: 0, // 取第0个参数作为组件函数
  },
}

// 重要函数
// 将声明语句转换为组件
export async function transformDeclarationToComponent(
  declaration: Declaration,
): Promise<Component | undefined> {
  if (declaration.type === 'FunctionDeclarationWithBaseInfo') {
    const {
      functionDeclaration,
      jsxElementsWithNodePath,
      leadingComment,
      context,
      blockStateWithNodePath,
    } = declaration

    // 判断是否是jsx组件
    const isJsxComponent = declaration.jsxElementsWithNodePath.length > 0
    if (!isJsxComponent) {
      console.error(
        `[${context.path} ${functionDeclaration.id.name}] 不是jsx组件`,
      )
      return
    }

    try {
      const functionName = functionDeclaration.id.name
      // 收集组件的注释
      let componentDescription = ''
      for (const item of parseComment(`/*${leadingComment?.value}*/`)) {
        item.tags.forEach((tag) => {
          if (tag.name === 'description') {
            componentDescription = tag.name
          }
        })
      }

      // 收集组件参数的类型注解
      const componentParams = (
        await Promise.all(
          functionDeclaration.params
            .filter(param => param.type === 'Identifier')
            .map(param =>
              parseCustomTypeAnnotation(param.typeAnnotation, context),
            ),
        )
      ).filter(item => item !== undefined)

      // 收集组件的函数体
      // 待开发，先挂在这里
      const componentFunctionBody = await parseCustomBinding(
        blockStateWithNodePath,
        context,
      )

      // 收集并解析组件中的JSX元素
      const recordedJSXElements = jsxElementsWithNodePath.reduce<Record<string, NodePath<JSXElement>>>((acc, jsxElement) => {
        jsxElement.traverse({
          JSXOpeningElement(path) {
            const name = path.node.name
            if (name.type === 'JSXIdentifier' && name.name !== functionName && /^[A-Z]/.test(name.name)) {
              acc[name.name] = jsxElement
            }
          },
        })
        return acc
      }, {})

      const componentJSXElements = (
        await Promise.all(
          Object.values(recordedJSXElements).map(jsxElement =>
            parseComponentJSXElement(jsxElement, context),
          ),
        )
      ).filter((item): item is ComponentJSXElement => item !== undefined)

      // 组装信息为组件
      const component: Component = {
        type: 'LocalComponent',
        componentName: functionName,
        componentFilePath: context.path,
        componentKey: `${functionName}-${context.path}`,
        componentDescription,
        componentJSXElements,
        componentParams,
      }
      globalComponentContext[component.componentKey] = component

      // 副作用
      // 将jsx元素中的组件声明也转换为组件
      for (const jsxElement of componentJSXElements) {
        const declaration = await scanDeclarationInContext(
          jsxElement.elementName,
          context,
        )

        if (declaration) {
          const component = await transformDeclarationToComponent(declaration)
          if (component) {
            globalComponentContext[component.componentKey] = component
          }
        }
      }

      return component
    }
    catch (e) {
      console.error(e)
      return
    }
  }

  if (declaration.type === 'NodeModuleImportDeclaration') {
    const componentKey = `${declaration.id.name}-${declaration.filePath}`

    globalComponentContext[componentKey] = {
      type: 'NodeComponent',
      componentName: declaration.id.name,
      packageName: declaration.filePath,
      componentKey,
    }
  }

  //  对HOC进行处理
  if (declaration.type === 'VariableDeclaratorWithBaseInfo') {
    let arrowFunctionWithNodePath: NodePath<ArrowFunctionExpression> | undefined

    let isFound = false
    declaration.nodePath.traverse({
      ArrowFunctionExpression(path) {
        if (isFound) {
          return
        }

        // 如 const a = memo(function)
        const isHOC = path.parent.type === 'CallExpression' && path.parent.callee.type === 'Identifier' && path.key === HOC_WHITELIST[path.parent.callee.name].paramIndex
        // 如 const a = () => {}
        const isTopLevel = path.parent.type === 'VariableDeclarator'
        // 如 const a = memo(function)
        const isDefault = path.parent.type === 'CallExpression'
        if (isHOC || isTopLevel || isDefault) {
          isFound = true
          arrowFunctionWithNodePath = path
        }
      },
    })

    if (arrowFunctionWithNodePath) {
      const functionDeclaration = transformArrowFunctionToFunctionDeclaration(arrowFunctionWithNodePath, declaration.filePath, declaration.context)
      if (functionDeclaration) {
        Object.assign(functionDeclaration.id, declaration.id)
        return await transformDeclarationToComponent(functionDeclaration)
      }
    }
  }
}
