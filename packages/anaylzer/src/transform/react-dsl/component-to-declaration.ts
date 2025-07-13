import type { Component, Declaration } from '../../types'
import { scanFileContext } from '../../scan/file-context'

// 将组件转换为声明语句
export function transformComponentToDeclaration(
  component: Component,
): Declaration | undefined {
  if (component.type === 'LocalComponent') {
    const fileContext = scanFileContext(
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
      encryptedKey: component.componentKey,
    }
  }
}
