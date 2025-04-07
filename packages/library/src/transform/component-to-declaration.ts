import type { Component, Declaration } from '../types'
import { scanFileContextByAutoFile } from '../scan'

// 将组件转换为声明语句
export async function transformComponentToDeclaration(
  component: Component,
): Promise<Declaration | undefined> {
  if (component.type === 'LocalComponent') {
    const fileContext = await scanFileContextByAutoFile(
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
