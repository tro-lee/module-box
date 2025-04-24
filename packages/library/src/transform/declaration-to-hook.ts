import type { NodePath } from '@babel/core'
import type { ArrowFunctionExpression } from '@babel/types'
import type {
  Declaration,
  Hook,
} from '../types'
import { GlobalHookContext } from '../constanst'
import { transformArrowFunctionToDeclaration } from './arrow-function-to-declaration'
import { getFunctionBaseInfo, isHookFunction } from './utils'

// 重要函数
// 将声明语句转换为Hook函数
export async function transformDeclarationToHook(
  declaration: Declaration,
): Promise<Hook | undefined> {
  if (declaration.type === 'FunctionDeclarationWithBaseInfo') {
    const {
      functionDeclaration,
      context,
    } = declaration

    if (!isHookFunction(declaration)) {
      console.error(
        `${context.path} ${functionDeclaration.id.name} 不是hook函数`,
      )
      return
    }

    // 收集函数的基础信息
    const {
      functionName,
      functionDescription,
      functionParams,
    } = await getFunctionBaseInfo(declaration)

    // 组装信息为组件
    const hook: Hook = {
      type: 'LocalHook',
      hookName: functionName,
      hookFilePath: context.path,
      hookKey: `${functionName}-${context.path}`,
      hookDescription: functionDescription,
      hookParams: functionParams,
      locStart: declaration.locStart,
      locEnd: declaration.locEnd,
    }

    GlobalHookContext[hook.hookKey] = hook
    return hook
  }

  if (declaration.type === 'NodeModuleImportDeclaration') {
    const hookKey = `${declaration.id.name}-${declaration.filePath}`
    const hook = {
      type: 'NodeHook',
      hookName: declaration.id.name,
      packageName: declaration.filePath,
      hookKey,
    } as Hook

    GlobalHookContext[hookKey] = hook
    return hook
  }

  // 对const a = () => {}处理
  // 对const a = memo(function)处理
  if (declaration.type === 'VariableDeclaratorWithBaseInfo') {
    let arrowFunctionWithNodePath: NodePath<ArrowFunctionExpression> | undefined
    let isFound = false
    declaration.nodePath.traverse({
      ArrowFunctionExpression(path) {
        if (isFound) {
          return
        }

        if (path.parent.type === 'CallExpression') {
          isFound = true
          arrowFunctionWithNodePath = path
        }
      },
    })

    if (arrowFunctionWithNodePath) {
      const functionDeclaration = transformArrowFunctionToDeclaration(
        arrowFunctionWithNodePath,
        declaration.filePath,
        declaration.context,
        declaration.locStart,
        declaration.locEnd,
      )
      if (functionDeclaration) {
        Object.assign(functionDeclaration.id, declaration.id)
        return await transformDeclarationToHook(functionDeclaration)
      }
    }
  }
}
