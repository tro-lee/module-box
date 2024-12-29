import {
  Comment,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  TSExpressionWithTypeArguments,
  TSInterfaceDeclaration,
  TSTypeElement,
} from "@babel/types";

interface WithBaseInfo<T> {
  id: Identifier;
  nodePath: NodePath<T>;
  filePath: string;
  leadingComment?: Comment;
}

type FunctionDeclarationWithComment =
  & WithBaseInfo<FunctionDeclaration>
  & {
    type: "FunctionDeclarationWithComment";
    functionDeclaration: Pick<FunctionDeclaration, "body" | "params"> & {
      id: Identifier;
    };
  };

type InterfaceDeclarationWithComment =
  & WithBaseInfo<TSInterfaceDeclaration>
  & {
    type: "InterfaceDeclarationWithComment";
    tsTypeElements: TSTypeElement[];
    extendsExpression: TSExpressionWithTypeArguments[];
    interfaceDeclaration: TSInterfaceDeclaration;
  };

type NodeModuleImportDeclarationItem = {
  type: "NodeModuleImportDeclarationItem";
  id: Identifier;
  path: string;
};

type FileContext = {
  path: string;
  interfacesWithComment: InterfaceDeclarationWithComment[];
  functionsWithComment: FunctionDeclarationWithComment[];
  importDeclarations: ImportDeclaration[];
};

type ModuleComponent = {
  componentName: string;
  componentDescription: string;
};

// ============================================
interface Prop {
  propKey: string;
  propType?: CustomTypeAnnotation;
}

type BaseTypeAnnotation<T extends string> = {
  type: T;
};
type NodeModuleImportTypeAnnotation =
  & BaseTypeAnnotation<"NodeModuleImportTypeAnnotation">
  & {
    typeName: string;
    importPath: string;
  };
type InterfaceTypeAnnotation = BaseTypeAnnotation<"InterfaceTypeAnnotation"> & {
  filePath: string;
  interfaceName: string;
  interfaceDescription: string;
  interfaceProps: Prop[];
  interfaceExtends: CustomTypeAnnotation[];
};
type ObjectTypeAnnotation = BaseTypeAnnotation<"ObjectTypeAnnotation"> & {
  props: Prop[];
};
type UnionTypeAnnotation = BaseTypeAnnotation<"UnionTypeAnnotation"> & {
  members: CustomTypeAnnotation[];
};
type ArrayTypeAnnotation = BaseTypeAnnotation<"ArrayTypeAnnotation"> & {
  elementType: CustomTypeAnnotation;
};
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
type NullTypeAnnotation = BaseTypeAnnotation<"NullTypeAnnotation">;
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
