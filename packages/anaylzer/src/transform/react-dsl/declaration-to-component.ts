import type { NodePath } from '@babel/core'
import type { ArrowFunctionExpression, JSXElement } from '@babel/types'
import type {
  Component,
  Declaration,
} from '../../types'
import { compact, uniq } from 'lodash'
import { GlobalComponentContext, HOC_WHITELIST } from '../../constanst'
import { parseBlockStatement } from '../../parse/block-statement'
import { parseComponentJSXElement } from '../../parse/jsx-element'
import { scanDeclarationInContext } from '../../scan/declaration'
import { getFunctionBaseInfo, isJsxComponent } from '../utils'
import { transformVariableToArrowFunction } from './variable-to-arrow-function'

// 重要函数
// 将声明语句转换为组件
export async function transformDeclarationToComponent(
  declaration: Declaration,
): Promise<Component | undefined> {
  // 核心 对本地组件进行处理
  if (declaration.type === 'FunctionDeclarationWithBaseInfo') {
    const {
      jsxElementsWithNodePath,
      context,
      blockStateWithNodePath,
      locStart,
      locEnd,
    } = declaration

    // 判断是否是jsx组件
    if (!isJsxComponent(declaration)) {
      return
    }

    // 收集函数的基础信息
    const {
      functionName,
      functionDescription,
      functionParams,
    } = await getFunctionBaseInfo(declaration)

    // 收集组件的函数体
    const {
      hooks,
    } = await parseBlockStatement(
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
    const componentJSXElements = compact(
      await Promise.all(
        Object.values(recordedJSXElements).map(jsxElement =>
          parseComponentJSXElement(jsxElement, context),
        ),
      ),
    )

    const referencedHookKeys = uniq(hooks.map(hook => hook.hookKey))
    const referencedComponentKeys = uniq(componentJSXElements.map(jsxElement => jsxElement.componentKey))

    // 组装信息为组件
    const component: Component = {
      type: 'LocalComponent',
      componentName: functionName,
      componentFilePath: context.path,
      componentKey: declaration.encryptedKey,
      componentParams: functionParams,
      referencedHookKeys,
      referencedComponentKeys,
      locStart,
      locEnd,
    }
    GlobalComponentContext[component.componentKey] = component

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
          GlobalComponentContext[component.componentKey] = component
        }
      }
    }

    return component
  }

  // 对引用组件进行处理
  if (declaration.type === 'NodeModuleImportDeclaration') {
    // 导入语句比较特殊，它的key直接生成了
    const componentKey = declaration.encryptedKey

    GlobalComponentContext[componentKey] = {
      type: 'NodeComponent',
      componentName: declaration.id.name,
      packageName: declaration.filePath,
      componentKey,
    }
  }

  // 对HOC进行处理
  if (declaration.type === 'VariableDeclaratorWithBaseInfo') {
    let arrowFunctionWithNodePath: NodePath<ArrowFunctionExpression> | undefined

    let isFound = false
    declaration.nodePath.traverse({
      ArrowFunctionExpression(path) {
        if (isFound) {
          return
        }

        // 如 const a = memo(function)
        const isHOC = path.parent.type === 'CallExpression' && path.parent.callee.type === 'Identifier' && path.key === HOC_WHITELIST[path.parent.callee.name]?.paramIndex
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
      const functionDeclaration = transformVariableToArrowFunction(
        arrowFunctionWithNodePath,
        declaration,
      )
      if (functionDeclaration) {
        Object.assign(functionDeclaration.id, declaration.id)
        return await transformDeclarationToComponent(functionDeclaration)
      }
    }
  }
}
