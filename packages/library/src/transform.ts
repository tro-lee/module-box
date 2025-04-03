import type { NodePath } from '@babel/core'
import type { JSXElement } from '@babel/types'
import type {
  Component,
  ComponentJSXElement,
  Declaration,
  FileContext,
  Module,
} from './types'
import { parse as parseComment } from 'comment-parser'
import { getDeclarationInContext } from './context'
import {
  parseComponentJSXElement,
  parseCustomBinding,
  parseCustomTypeAnnotation,
} from './parse'
import { scanAstByFileWithAutoExtension } from './scan'

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

let globalComponentContext: Record<string, Component> = {}

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
          JSXIdentifier(path) {
            // 只有是组件名，并且是首字母大写，并且不是当前组件名，才记录
            if (
              path.parent.type === 'JSXOpeningElement'
              && path.node.name
              && /^[A-Z]/.test(path.node.name)
              && path.node.name !== functionName
            ) {
              acc[path.node.name] = jsxElement
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
      // 顺便将jsx元素中的组件声明也转换为组件
      for (const jsxElement of componentJSXElements) {
        const declaration = await getDeclarationInContext(
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
}

// 将文件上下文转换为模块和组件
async function transformFileContextToModuleAndComponent(
  context: FileContext,
  _globalComponentContext: Record<string, Component>,
) {
  // 载入全局组件上下文
  globalComponentContext = _globalComponentContext

  const modules: Module[] = []
  for (const functionWithBaseInfo of context.functionsWithBaseInfo) {
    if (
      functionWithBaseInfo.nodePath.parent.type !== 'ExportSpecifier'
      && functionWithBaseInfo.nodePath.parent.type !== 'ExportAllDeclaration'
      && functionWithBaseInfo.nodePath.parent.type !== 'ExportNamedDeclaration'
      && functionWithBaseInfo.nodePath.parent.type !== 'ExportDefaultDeclaration'
    ) {
      continue
    }

    const component = await transformDeclarationToComponent(
      functionWithBaseInfo,
    )
    if (!component || component.type !== 'LocalComponent') {
      continue
    }

    modules.push({
      type: 'LocalModule',
      key: `Module-${component.componentKey}`,
      componentFilePath: component.componentFilePath,
      componentName: component.componentName,
      componentKey: component.componentKey,
    })
  }

  return modules
}

// ============================================
// 下面是暴露给外部的函数
// 外部提供文件路径后，即可拿到组件和模块信息
// ============================================

// 将文件路径列表转换为模块和组件
export async function transformFilePathsToModuleAndComponent(
  filePaths: string[],
) {
  const fileContexts: Record<string, FileContext> = {}
  for (const filePath of filePaths) {
    const fileContext = await scanAstByFileWithAutoExtension(filePath)
    if (!fileContext)
      continue
    fileContexts[filePath] = fileContext
  }

  const resultModules: Record<string, Module> = {}
  const resultComponentContext: Record<string, Component> = {}

  for (const fileContext of Object.values(fileContexts)) {
    const modules = await transformFileContextToModuleAndComponent(
      fileContext,
      resultComponentContext,
    )
    for (const module of modules) {
      resultModules[module.componentName] = module
    }
  }

  return {
    modules: resultModules,
    components: resultComponentContext,
  }
}
