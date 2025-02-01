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
  interfacesWithComment: InterfaceDeclarationWithComment[];
  functionsWithComment: FunctionDeclarationWithComment[];
  variablesWithComment: VariableDeclaratorWithComment[];

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

export type FunctionDeclarationWithComment = (
  | (WithBaseInfo<FunctionDeclaration> & {
      isArrowFunction: false;
    })
  | (WithBaseInfo<ArrowFunctionExpression> & {
      isArrowFunction: true;
    })
) & {
  type: "FunctionDeclarationWithComment";
  functionDeclaration: Pick<FunctionDeclaration, "body" | "params"> & {
    id: Identifier;
  };
  // 函数里面具体内容：
  jsxElementsWithNodePath: NodePath<JSXElement>[]; // 涉及到的所有JSXElement
  blockStateWithNodePath: NodePath<BlockStatement>;
};

export type InterfaceDeclarationWithComment =
  WithBaseInfo<TSInterfaceDeclaration> & {
    type: "InterfaceDeclarationWithComment";
    tsTypeElements: TSTypeElement[];
    extendsExpression: TSExpressionWithTypeArguments[];
    interfaceDeclaration: TSInterfaceDeclaration;
  };

export type VariableDeclaratorWithComment = WithBaseInfo<VariableDeclarator> & {
  type: "VariableDeclaratorWithComment";
  variableDeclarator: VariableDeclarator;
};

export type NodeModuleImportDeclaration = Omit<
  Omit<WithBaseInfo<ImportDeclaration>, "context">,
  "nodePath"
> & {
  type: "NodeModuleImportDeclaration";
};

export type TodoDeclaration = Pick<
  WithBaseInfo<Node>,
  "id" | "filePath" | "nodePath" | "context"
> & {
  type: "TodoDeclaration";
};

export type Declaration =
  | InterfaceDeclarationWithComment
  | FunctionDeclarationWithComment
  | VariableDeclaratorWithComment
  | NodeModuleImportDeclaration
  | TodoDeclaration;

// ============================================
// 模块组件相关 最终成果
// ============================================
export type ModuleComponent =
  | {
      type: "LocalModuleComponent";
      componentName: string;
      componentDescription: string;
      componentJSXElements: ComponentJSXElement[];
      componentParams: CustomTypeAnnotation[];
    }
  | {
      type: "NodeModuleComponent";
      componentName: string;
      packageName: string;
    }
  | {
      type: "UnknownComponent";
      componentName: string;
      sourceCode: string;
    };

export type ComponentJSXElement = {
  type: "ComponentJSXElement";
  elementName: string;
  importPath: string;
};

// ============================================
// 类型注解
// ============================================

export interface Prop {
  propKey: string;
  propType?: CustomTypeAnnotation;
}

export type BaseTypeAnnotation<T extends string> = {
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
