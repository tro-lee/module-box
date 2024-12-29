import {
  Comment,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  TSExpressionWithTypeArguments,
  TSInterfaceDeclaration,
  TSTypeElement,
} from "@babel/types";

// ============================================
// 基础类型
// ============================================

type FileContext = {
  path: string;
  interfacesWithComment: InterfaceDeclarationWithComment[];
  functionsWithComment: FunctionDeclarationWithComment[];
  importDeclarations: ImportDeclaration[];
};

// ============================================
// 声明语句相关
// ============================================

interface WithBaseInfo<T> {
  id: Identifier;
  nodePath: NodePath<T>;
  filePath: string;
  leadingComment?: Comment;
  context: FileContext;
}

type FunctionDeclarationWithComment = WithBaseInfo<FunctionDeclaration> & {
  type: "FunctionDeclarationWithComment";
  functionDeclaration: Pick<FunctionDeclaration, "body" | "params"> & {
    id: Identifier;
  };
};

type InterfaceDeclarationWithComment = WithBaseInfo<TSInterfaceDeclaration> & {
  type: "InterfaceDeclarationWithComment";
  tsTypeElements: TSTypeElement[];
  extendsExpression: TSExpressionWithTypeArguments[];
  interfaceDeclaration: TSInterfaceDeclaration;
};

type NodeModuleImportDeclaration = WithBaseInfo<ImportDeclaration> & {
  type: "NodeModuleImportDeclaration";
};

// ============================================
// 模块组件相关
// ============================================

type WithModuleComponentBaseInfo<T> = {
  type: T;
  componentName: string;
};

type LocalModuleComponent =
  & WithModuleComponentBaseInfo<"LocalModuleComponent">
  & {
    componentDescription: string;
    componentJSXElements: ComponentJSXElement[];
    componentParams: Param[];
  };

type NodeModuleComponent =
  & WithModuleComponentBaseInfo<"NodeModuleComponent">
  & {
    packageName: string;
  };

type ModuleComponent = LocalModuleComponent | NodeModuleComponent;

type ComponentJSXElement = {
  type: "ComponentJSXElement";
  componentName: string;
  componentParams: any[];
  importPath: string;
  moduleComponent: ModuleComponent;
  functionDeclaration:
    | FunctionDeclarationWithComment
    | NodeModuleImportDeclaration;
};

// ============================================
// 类型注解
// ============================================

interface Prop {
  propKey: string;
  propType?: CustomTypeAnnotation;
}

type BaseTypeAnnotation<T extends string> = {
  type: T;
};

// Node模块类型
type NodeModuleImportTypeAnnotation =
  & BaseTypeAnnotation<"NodeModuleImportTypeAnnotation">
  & {
    typeName: string;
    importPath: string;
  };

// 接口类型
type InterfaceTypeAnnotation = BaseTypeAnnotation<"InterfaceTypeAnnotation"> & {
  filePath: string;
  interfaceName: string;
  interfaceDescription: string;
  interfaceProps: Prop[];
  interfaceExtends: CustomTypeAnnotation[];
};

// 复杂类型
type ObjectTypeAnnotation = BaseTypeAnnotation<"ObjectTypeAnnotation"> & {
  props: Prop[];
};

type UnionTypeAnnotation = BaseTypeAnnotation<"UnionTypeAnnotation"> & {
  members: CustomTypeAnnotation[];
};

type ArrayTypeAnnotation = BaseTypeAnnotation<"ArrayTypeAnnotation"> & {
  elementType: CustomTypeAnnotation;
};

// 基础类型
type NullTypeAnnotation = BaseTypeAnnotation<"NullTypeAnnotation">;
type StringKeywordTypeAnnotation = BaseTypeAnnotation<
  "StringKeywordTypeAnnotation"
>;
type NumberKeywordTypeAnnotation = BaseTypeAnnotation<
  "NumberKeywordTypeAnnotation"
>;
type BooleanKeywordTypeAnnotation = BaseTypeAnnotation<
  "BooleanKeywordTypeAnnotation"
>;
type AnyTypeAnnotation = BaseTypeAnnotation<"AnyTypeAnnotation">;
type UndefinedTypeAnnotation = BaseTypeAnnotation<"UndefinedTypeAnnotation">;

// 特殊类型
type TodoTypeAnnotation = BaseTypeAnnotation<"TodoTypeAnnotation"> & {
  typeAnnotation: any;
};

type CustomTypeAnnotation =
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
  | TodoTypeAnnotation
  | UndefinedTypeAnnotation
  | NullTypeAnnotation
  | undefined;

// ============================================
// 杂用
// ============================================

type Variable = {
  name: string;
  source: Source;
};

type Source = CallExpressionSource | IdentifierSource;

type CallExpressionSource = {
  type: "CallExpression";
  calleeName: string;
  arguments: string[];
};

type IdentifierSource = {
  type: "Identifier";
  name: string;
};
