import { Node, NodePath, ParseResult } from "@babel/core";
import {
  Comment,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  TSExpressionWithTypeArguments,
  TSInterfaceDeclaration,
  TSTypeElement,
  VariableDeclarator,
  ArrowFunctionExpression,
  JSXElement,
  BlockStatement,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
} from "@babel/types";

// ============================================
// 基础类型
// ============================================

export type FileContext = {
  path: string;
  ast: ParseResult;
  interfacesWithBaseInfo: InterfaceDeclarationWithBaseInfo[];
  functionsWithBaseInfo: FunctionDeclarationWithBaseInfo[];
  variablesWithBaseInfo: VariableDeclaratorWithBaseInfo[];

  importDeclarationsWithNodePath: NodePath<ImportDeclaration>[];
  exportDefaultDeclarationWithNodePath?: NodePath<ExportDefaultDeclaration>;
  exportAllDeclarationsWithNodePath: NodePath<ExportAllDeclaration>[];
  exportNamedDeclarationsWithNodePath: NodePath<ExportNamedDeclaration>[];
};

// ============================================
// 声明语句相关 上下文内容
// ============================================

interface WithBaseInfo<T extends Node> {
  id: Identifier;
  filePath: string;
  nodePath: NodePath<T>;
  leadingComment?: Comment;
  context: FileContext;
}

type FunctionDeclarationWithBaseInfo = (
  | (WithBaseInfo<FunctionDeclaration> & {
      isArrowFunction: false;
    })
  | (WithBaseInfo<ArrowFunctionExpression> & {
      isArrowFunction: true;
    })
) & {
  type: "FunctionDeclarationWithBaseInfo";
  functionDeclaration: Pick<FunctionDeclaration, "body" | "params"> & {
    id: Identifier;
  };
  // 函数里面具体内容：
  jsxElementsWithNodePath: NodePath<JSXElement>[]; // 涉及到的所有JSXElement
  blockStateWithNodePath: NodePath<BlockStatement>;
};

type InterfaceDeclarationWithBaseInfo = WithBaseInfo<TSInterfaceDeclaration> & {
  type: "InterfaceDeclarationWithBaseInfo";
  tsTypeElements: TSTypeElement[];
  extendsExpression: TSExpressionWithTypeArguments[];
  interfaceDeclaration: TSInterfaceDeclaration;
};

type VariableDeclaratorWithBaseInfo = WithBaseInfo<VariableDeclarator> & {
  type: "VariableDeclaratorWithBaseInfo";
  variableDeclarator: VariableDeclarator;
};

type NodeModuleImportDeclaration = Omit<
  Omit<WithBaseInfo<ImportDeclaration>, "context">,
  "nodePath"
> & {
  type: "NodeModuleImportDeclaration";
};

type TodoDeclaration = Pick<
  WithBaseInfo<Node>,
  "id" | "filePath" | "nodePath" | "context"
> & {
  type: "TodoDeclaration";
};

export type Declaration =
  | InterfaceDeclarationWithBaseInfo
  | FunctionDeclarationWithBaseInfo
  | VariableDeclaratorWithBaseInfo
  | NodeModuleImportDeclaration
  | TodoDeclaration;

// ============================================
// 模块组件相关 最终成果
// ============================================
export type Module =
  | {
      type: "LocalModule";
      componentName: string;
      componentFilePath: string;
      componentKey: string; // 组件唯一标识Name-FilePath
    }
  | {
      type: "NodeModule";
      componentName: string;
      packageName: string;
    }
  | {
      type: "UnknownModule";
      componentName: string;
      sourceCode: string;
    };

export type Component =
  | {
      type: "LocalComponent";
      componentName: string;
      componentFilePath: string;
      componentKey: string; // 组件唯一标识Name-FilePath
      componentDescription: string;
      componentJSXElements: ComponentJSXElement[];
      componentParams: CustomTypeAnnotation[];
      componentCssStyles: Record<string, Record<string, string | number>>; // 所涉及的样式类
    }
  | {
      type: "NodeComponent";
      componentName: string;
      packageName: string;
      componentKey: string; // 组件唯一标识Name-PackageName
    };

export type ComponentJSXElement = {
  elementName: string;
  componentName: string; // 故意冗余 方便使用
  componentFilePath: string; // 故意冗余 方便使用
  componentKey: string; // 组件唯一标识Name-FilePath
};

// ============================================
// 类型注解 给外部使用
// ============================================

export interface Prop {
  propKey: string;
  propType?: CustomTypeAnnotation;
}

type BaseTypeAnnotation<T extends string> = {
  type: T;
};

// Node模块类型
export type NodeModuleImportTypeAnnotation =
  BaseTypeAnnotation<"NodeModuleImportTypeAnnotation"> & {
    typeName: string;
    importPath: string;
  };

// 接口类型
export type InterfaceTypeAnnotation =
  BaseTypeAnnotation<"InterfaceTypeAnnotation"> & {
    filePath: string;
    interfaceName: string;
    interfaceDescription: string;
    interfaceProps: Prop[];
    interfaceExtends: CustomTypeAnnotation[];
  };

// 复杂类型
export type ObjectTypeAnnotation =
  BaseTypeAnnotation<"ObjectTypeAnnotation"> & {
    props: Prop[];
  };

export type UnionTypeAnnotation = BaseTypeAnnotation<"UnionTypeAnnotation"> & {
  members: CustomTypeAnnotation[];
};

export type ArrayTypeAnnotation = BaseTypeAnnotation<"ArrayTypeAnnotation"> & {
  elementType: CustomTypeAnnotation;
};

// 基础类型
export type NullTypeAnnotation = BaseTypeAnnotation<"NullTypeAnnotation">;
export type StringKeywordTypeAnnotation =
  BaseTypeAnnotation<"StringKeywordTypeAnnotation">;
export type NumberKeywordTypeAnnotation =
  BaseTypeAnnotation<"NumberKeywordTypeAnnotation">;
export type BooleanKeywordTypeAnnotation =
  BaseTypeAnnotation<"BooleanKeywordTypeAnnotation">;
export type AnyTypeAnnotation = BaseTypeAnnotation<"AnyTypeAnnotation">;
export type UndefinedTypeAnnotation =
  BaseTypeAnnotation<"UndefinedTypeAnnotation">;

// 特殊类型
export type TodoTypeAnnotation = BaseTypeAnnotation<"TodoTypeAnnotation"> & {
  typeName: string;
  data?: any;
};

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
  | TodoTypeAnnotation;
