import {
  Comment,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  TSInterfaceDeclaration,
  TSTypeElement,
} from "@babel/types";

// Base interfaces for common properties
interface WithComment {
  id: Identifier;
  leadingComment?: Comment;
}

interface WithPath<T> {
  path: NodePath<T>;
}

type FunctionDeclarationWithComment =
  & WithComment
  & WithPath<FunctionDeclaration>
  & {
    type: "FunctionDeclarationWithComment";
    functionDeclaration: FunctionDeclaration & { id: Identifier };
  };

type InterfaceDeclarationWithComment =
  & WithComment
  & WithPath<TSInterfaceDeclaration>
  & {
    type: "InterfaceDeclarationWithComment";
    tsTypeElements: TSTypeElement[];
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

type GlobalContext = Map<string, FileContext>;

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
};
type ObjectTypeAnnotation = BaseTypeAnnotation<"ObjectTypeAnnotation"> & {
  props: Prop[];
};
type UnionTypeAnnotation = BaseTypeAnnotation<"UnionTypeAnnotation"> & {
  members: CustomTypeAnnotation[];
};
type NullTypeAnnotation = BaseTypeAnnotation<"NullTypeAnnotation">;
type CustomTypeAnnotation =
  | NodeModuleImportTypeAnnotation
  | InterfaceTypeAnnotation
  | ObjectTypeAnnotation
  | UnionTypeAnnotation
  | NullTypeAnnotation
  | undefined;

type ModuleComponent = {
  componentName: string;
  componentDescription: string;
};
