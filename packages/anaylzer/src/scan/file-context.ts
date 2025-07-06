import type { NodePath, ParseResult } from '@babel/core'
import type {
  BlockStatement,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  JSXElement,
  TSInterfaceDeclaration,
  VariableDeclaration,
  VariableDeclarator,
} from '@babel/types'
import type { FileContext } from '../types'
import fs from 'node:fs'
import { traverse } from '@babel/core'
import * as babel from '@babel/parser'
import { generateUniqueId } from '../utils'

const astContextCache: Record<string, FileContext> = {}

// 扫描文件，找到顶级作用域声明的接口、函数、变量、导入导出语句
async function scanFileContextByFile(filePath: string): Promise<FileContext | null> {
  // 缓存逻辑
  if (filePath in astContextCache) {
    return astContextCache[filePath]
  }

  // ==============================
  // 从文件中解析出 所要的语法树
  // ==============================

  let ast: ParseResult | null = null

  const sourceCode = fs.readFileSync(filePath, 'utf-8')

  try {
    ast = babel.parse(sourceCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })
  }
  catch (e) {
    console.error(`解析失败: ${filePath}\n${e}`)
    return null
  }

  if (!ast) {
    console.error('AST parsing failed')
    return null
  }

  // ==============================
  // 根据语法树 填充上下文
  // ==============================

  const context: FileContext = {
    path: filePath,
    ast,
    interfacesWithBaseInfo: [],
    functionsWithBaseInfo: [],
    variablesWithBaseInfo: [],
    importDeclarationsWithNodePath: [],
    exportAllDeclarationsWithNodePath: [],
    exportNamedDeclarationsWithNodePath: [],
  }

  traverse(ast, {
    // 塞入声明
    ImportDeclaration(path: NodePath<ImportDeclaration>) {
      context.importDeclarationsWithNodePath.push(path)
    },
    ExportAllDeclaration(path: NodePath<ExportAllDeclaration>) {
      context.exportAllDeclarationsWithNodePath.push(path)
    },
    ExportDefaultDeclaration(path: NodePath<ExportDefaultDeclaration>) {
      context.exportDefaultDeclarationWithNodePath = path
    },
    ExportNamedDeclaration(path: NodePath<ExportNamedDeclaration>) {
      context.exportNamedDeclarationsWithNodePath.push(path)
    },
    FunctionDeclaration(path: NodePath<FunctionDeclaration>) {
      // 确定是顶级作用域函数声明
      const ancestry = path.getFunctionParent()
      if (ancestry !== null) {
        return
      }

      // 暂时不支持匿名函数声明
      const id = path.node.id
      if (!id) {
        console.warn('FunctionDeclaration has no id', path.node)
        return
      }

      const functionDeclaration = path.node as FunctionDeclaration & {
        id: Identifier
      }

      const leadingComments
        = path.parent?.leadingComments ?? path.node.leadingComments
      const leadingComment = leadingComments?.at(-1)

      const jsxElementsWithNodePath: NodePath<JSXElement>[] = []
      let blockStateWithNodePath: NodePath<BlockStatement> | undefined

      path.traverse({
        JSXElement(path: NodePath<JSXElement>) {
          jsxElementsWithNodePath.push(path)
        },
        BlockStatement(_path: NodePath<BlockStatement>) {
          if (_path.parentPath === path) {
            blockStateWithNodePath = _path
          }
        },
      })

      const encryptedKey = generateUniqueId(id.name, filePath, 'FunctionDeclaration')

      context.functionsWithBaseInfo.push({
        type: 'FunctionDeclarationWithBaseInfo',
        isArrowFunction: false,
        nodePath: path,
        id,
        encryptedKey,
        leadingComment,
        filePath,
        context,
        functionDeclaration,
        jsxElementsWithNodePath,
        blockStateWithNodePath: blockStateWithNodePath!,
        locStart: path.node.start ?? 0,
        locEnd: path.node.end ?? 0,
      })
    },
    TSInterfaceDeclaration(path: NodePath<TSInterfaceDeclaration>) {
      // 确定是顶级作用域函数声明
      const ancestry = path.getFunctionParent()
      if (ancestry !== null) {
        return
      }

      const id = path.node.id
      if (!id) {
        console.warn('FunctionDeclaration has no id', path.node)
        return
      }

      const leadingComments
        = path.parent?.leadingComments ?? path.node.leadingComments
      const leadingComment = leadingComments?.at(-1)

      const encryptedKey = generateUniqueId(id.name, filePath, 'InterfaceDeclaration')

      context.interfacesWithBaseInfo.push({
        type: 'InterfaceDeclarationWithBaseInfo',
        id,
        leadingComment,
        nodePath: path,
        filePath,
        context,
        encryptedKey,
        tsTypeElements: path.node.body.body,
        extendsExpression: path.node.extends ?? [],
        interfaceDeclaration: path.node,
        locStart: path.node.start ?? 0,
        locEnd: path.node.end ?? 0,
      })
    },
    VariableDeclaration(path: NodePath<VariableDeclaration>) {
      // 确定是顶级作用域函数声明
      const ancestry = path.getFunctionParent()
      if (ancestry !== null) {
        return
      }

      path.traverse({
        VariableDeclarator(path: NodePath<VariableDeclarator>) {
          // 跳过变量为箭头函数的情况
          if (path.node.init?.type === 'ArrowFunctionExpression') {
            return
          }

          // 暂时只支持 变量声明
          if (path.node.id.type === 'Identifier') {
            const encryptedKey = generateUniqueId(path.node.id.name, filePath, 'VariableDeclaration')

            context.variablesWithBaseInfo.push({
              type: 'VariableDeclaratorWithBaseInfo',
              id: path.node.id,
              filePath,
              context,
              encryptedKey,
              variableDeclarator: path.node,
              nodePath: path,
              locStart: path.parent.start ?? 0,
              locEnd: path.parent.end ?? 0,
            })
          }
        },
      })
    },
  })

  astContextCache[filePath] = context
  return astContextCache[filePath]
}

// 扫描文件，返回文件的上下文
// 自动处理文件的扩展名
// 比如扫描 /XXX/X 视为 /XXX/X/index.ts
// 比如扫描 /XXX/X/hi 视为 /XXX/X/hi.ts
export async function scanFileContextByAutoFile(
  filePath: string,
): Promise<FileContext | null> {
  for (const ext of [
    '',
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '/index.ts',
    '/index.tsx',
    '/index.js',
    '/index.jsx',
  ]) {
    const _absoluteTargetImportPath = filePath + ext
    if (
      !fs.existsSync(_absoluteTargetImportPath)
      || !fs.statSync(_absoluteTargetImportPath).isFile()
    ) {
      continue
    }
    return scanFileContextByFile(_absoluteTargetImportPath)
  }

  return null
}
