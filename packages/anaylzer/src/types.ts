import type { Node, NodePath, ParseResult } from '@babel/core'
import type {
  ArrowFunctionExpression,
  BlockStatement,
  Comment,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  JSXElement,
  TSExpressionWithTypeArguments,
  TSInterfaceDeclaration,
  TSTypeElement,
  VariableDeclarator,
} from '@babel/types'

// ============================================
// 基础类型
// ============================================

export interface FileContext {
  path: string // 文件路径
  ast: ParseResult // 文件AST
  interfacesWithBaseInfo: InterfaceDeclarationWithBaseInfo[] // 接口声明
  functionsWithBaseInfo: FunctionDeclarationWithBaseInfo[] // 函数声明
  variablesWithBaseInfo: VariableDeclaratorWithBaseInfo[] // 变量声明

  importDeclarationsWithNodePath: NodePath<ImportDeclaration>[]
  exportDefaultDeclarationWithNodePath?: NodePath<ExportDefaultDeclaration>
  exportAllDeclarationsWithNodePath: NodePath<ExportAllDeclaration>[]
  exportNamedDeclarationsWithNodePath: NodePath<ExportNamedDeclaration>[]
}

// ============================================
// 声明语句相关 上下文内容
// ============================================

interface WithBaseInfo<T extends Node> {
  id: Identifier
  filePath: string
  encryptedKey: string
  locStart: number
  locEnd: number
  nodePath: NodePath<T>
  leadingComment?: Comment
  context: FileContext
}

type FunctionDeclarationWithBaseInfo =
  (| (WithBaseInfo<ArrowFunctionExpression> & { isArrowFunction: true })
    | (WithBaseInfo<FunctionDeclaration> & { isArrowFunction: false }))
  & {
    type: 'FunctionDeclarationWithBaseInfo'
    functionDeclaration: Pick<FunctionDeclaration, 'body' | 'params'> & {
      id: Identifier
    }
    // 函数里面具体内容：
    jsxElementsWithNodePath: NodePath<JSXElement>[] // 涉及到的所有JSXElement
    blockStateWithNodePath: NodePath<BlockStatement>
  }

type InterfaceDeclarationWithBaseInfo = WithBaseInfo<TSInterfaceDeclaration> & {
  type: 'InterfaceDeclarationWithBaseInfo'
  tsTypeElements: TSTypeElement[]
  extendsExpression: TSExpressionWithTypeArguments[]
  interfaceDeclaration: TSInterfaceDeclaration
}

type VariableDeclaratorWithBaseInfo = WithBaseInfo<VariableDeclarator> & {
  type: 'VariableDeclaratorWithBaseInfo'
  variableDeclarator: VariableDeclarator
}

type NodeModuleImportDeclaration = Pick<
  WithBaseInfo<ImportDeclaration>,
  'id' | 'filePath' | 'encryptedKey'
> & {
  type: 'NodeModuleImportDeclaration'
}

export type Declaration =
  | InterfaceDeclarationWithBaseInfo
  | FunctionDeclarationWithBaseInfo
  | VariableDeclaratorWithBaseInfo
  | NodeModuleImportDeclaration

// ============================================
// 模块组件相关 最终成果
// ============================================
export interface Module {
  type: 'LocalModule'
  moduleKey: string // module + componentKey
  componentKey: string // 组件唯一标识Name-FilePath
}

export type Hook = {
  type: 'LocalHook'
  hookName: string
  hookFilePath: string
  locStart: number
  locEnd: number
  hookKey: string
  hookDescription: string
  hookParams: CustomTypeAnnotation[]
} | {
  type: 'NodeModuleHook'
  hookName: string
  packageName: string
  hookKey: string
}
export type LocalHook = Extract<Hook, { type: 'LocalHook' }>

export type Component =
  | {
    type: 'LocalComponent'
    componentName: string
    componentFilePath: string
    locStart: number
    locEnd: number
    componentKey: string // 组件唯一标识Name-FilePath
    componentParams: CustomTypeAnnotation[]
    referencedHookKeys: string[]
    referencedComponentKeys: string[]
  }
  | {
    type: 'NodeComponent'
    componentName: string
    packageName: string
    componentKey: string // 组件唯一标识Name-PackageName
  }

export type LocalComponent = Extract<Component, { type: 'LocalComponent' }>
export interface ComponentJSXElement {
  elementName: string
  componentKey: string // 组件唯一标识Name-FilePath
}

export interface CustomBinding {
  name: string
  usedProperties: string[]
  referenceStatements: string[]
  referencePaths: NodePath<Node>[]
  initCalleeDeclaration: Declaration | null
}

// ============================================
// 类型注解 给外部使用
// ============================================

export interface Prop {
  propKey: string
  propType?: CustomTypeAnnotation
}

interface BaseTypeAnnotation<T extends string> {
  type: T
}

// Node模块类型
export type NodeModuleImportTypeAnnotation =
  BaseTypeAnnotation<'NodeModuleImportTypeAnnotation'> & {
    typeName: string
    importPath: string
  }

// 接口类型
export type InterfaceTypeAnnotation =
  BaseTypeAnnotation<'InterfaceTypeAnnotation'> & {
    filePath: string
    interfaceName: string
    interfaceDescription: string
    interfaceProps: Prop[]
    interfaceExtends: CustomTypeAnnotation[]
  }

// 复杂类型
export type ObjectTypeAnnotation =
  BaseTypeAnnotation<'ObjectTypeAnnotation'> & {
    props: Prop[]
  }

export type UnionTypeAnnotation = BaseTypeAnnotation<'UnionTypeAnnotation'> & {
  members: CustomTypeAnnotation[]
}

export type ArrayTypeAnnotation = BaseTypeAnnotation<'ArrayTypeAnnotation'> & {
  elementType: CustomTypeAnnotation
}

// 基础类型
export type NullTypeAnnotation = BaseTypeAnnotation<'NullTypeAnnotation'>
export type StringKeywordTypeAnnotation =
  BaseTypeAnnotation<'StringKeywordTypeAnnotation'>
export type NumberKeywordTypeAnnotation =
  BaseTypeAnnotation<'NumberKeywordTypeAnnotation'>
export type BooleanKeywordTypeAnnotation =
  BaseTypeAnnotation<'BooleanKeywordTypeAnnotation'>
export type AnyTypeAnnotation = BaseTypeAnnotation<'AnyTypeAnnotation'>
export type UndefinedTypeAnnotation =
  BaseTypeAnnotation<'UndefinedTypeAnnotation'>

// 特殊类型
export type TodoTypeAnnotation = BaseTypeAnnotation<'TodoTypeAnnotation'> & {
  typeName: string
  data?: any
}

export type CustomTypeAnnotation =
  | NodeModuleImportTypeAnnotation
  | InterfaceTypeAnnotation
  | ObjectTypeAnnotation
  | UnionTypeAnnotation
  | ArrayTypeAnnotation
  | NullTypeAnnotation
  | StringKeywordTypeAnnotation
  | NumberKeywordTypeAnnotation
  | BooleanKeywordTypeAnnotation
  | AnyTypeAnnotation
  | UndefinedTypeAnnotation
  | TodoTypeAnnotation
