import generate from '@babel/generator'
import { flatten } from 'lodash'
import { scanEntryFilePaths } from '../scan/entry-file'
import { scanFileContext } from '../scan/file-context'

// 重要的入口文件
// 将项目路径下的所有文件转换为代码库文档
export function transformProjectPathToDocument(projectPath: string, options: {
  exclude?: string[]
  include?: string[]
}) {
  // 获取所有文件上下文
  const entryFiles = scanEntryFilePaths(projectPath, {
    exclude: options.exclude,
    include: options.include,
  })
  const fileContexts = entryFiles
    .map(filePath => scanFileContext(filePath))
    .filter(fileContext => fileContext !== null)

  const declarations = fileContexts.map(fileContext =>
    [...fileContext.functionsWithBaseInfo.map(declaration => declaration), ...fileContext.variablesWithBaseInfo.map(declaration => declaration)],
  ).flat()

  return flatten(declarations.map((declaration) => {
    const { code } = generate(declaration.nodePath.node, {
      retainLines: false,
      comments: true,
    })

    return ([{
      pageContent: code,
      id: declaration.filePath + declaration.id.name,
      metadata: {
        filePath: declaration.filePath,
      },
    }])
  }))
}
