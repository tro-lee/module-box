import type { NodePath } from '@babel/core'
import type { ArrowFunctionExpression } from '@babel/types'
import type {
  Declaration,
  Hook,
} from '../../types'
import { GlobalHookContext } from '../../constanst'
import { getFunctionBaseInfo, isHookFunction } from '../utils'
import { transformVariableToArrowFunction } from './variable-to-arrow-function'

// 重要函数
// 将声明语句转换为Hook函数
export function transformDeclarationToHook(
  declaration: Declaration,
): Hook | undefined {
  if (declaration.type === 'FunctionDeclarationWithBaseInfo') {
    const { context } = declaration

    if (!isHookFunction(declaration)) {
      return
    }

    // 收集函数的基础信息
    const {
      functionName,
      functionDescription,
      functionParams,
    } = getFunctionBaseInfo(declaration)

    // 组装信息为组件
    const hook: Hook = {
      type: 'LocalHook',
      hookName: functionName,
      hookFilePath: context.path,
      hookKey: declaration.encryptedKey,
      hookDescription: functionDescription,
      hookParams: functionParams,
      locStart: declaration.locStart,
      locEnd: declaration.locEnd,
    }

    GlobalHookContext[hook.hookKey] = hook
    return hook
  }

  if (declaration.type === 'NodeModuleImportDeclaration') {
    const hookKey = declaration.encryptedKey
    const hook = {
      type: 'NodeModuleHook',
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
      const functionDeclaration = transformVariableToArrowFunction(
        arrowFunctionWithNodePath,
        declaration,
      )
      if (functionDeclaration) {
        Object.assign(functionDeclaration.id, declaration.id)
        return transformDeclarationToHook(functionDeclaration)
      }
    }
  }
}
