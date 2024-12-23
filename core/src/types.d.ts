import {
  Comment,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  TSInterfaceDeclaration,
  TSTypeElement,
} from "@babel/types";

// AST相关 ==============================

export type FunctionDeclarationWithComment = {
  type: "FunctionDeclarationWithComment";

  // 糖
  id: Identifier;
  leadingComment: Comment | undefined;

  // 实际数据
  path: NodePath<FunctionDeclaration>;
  functionDeclaration: FunctionDeclaration & { id: Identifier };
};

export type InterfaceDeclarationWithComment = {
  type: "InterfaceDeclarationWithComment";

  // 糖
  id: Identifier;
  leadingComment: Comment | undefined;
  tsTypeElements: TSTypeElement[];

  // 实际数据
  path: NodePath<TSInterfaceDeclaration>;
  interfaceDeclaration: TSInterfaceDeclaration;
};

export type NodeModuleItem = {
  type: "NodeModuleItem";
  id: Identifier;
  path: string;
};

// 上下文相关 ==============================

export type FileContext = LocalFileContext | NodeModuleFileContext;

export type LocalFileContext = {
  type: "LocalFileContext";
  path: string;
  interfacesWithComment: InterfaceDeclarationWithComment[];
  functionsWithComment: FunctionDeclarationWithComment[];
  importDeclarations: ImportDeclaration[];
};

export type NodeModuleFileContext = {
  type: "NodeModuleFileContext";
  path: string;
};

export type GlobalContext = Map<string, FileContext>;

// 模块信息相关 =============================

export type ModuleComponent = {
  componentName: string;
  componentDescription: string;

  // 组件参数
  componentParams: Param[];
};

export type Param = {
  paramName: string;
  paramDescription: string;

  paramProps: Prop[];
};

export type Prop = {
  propKey: string;
  propType: any;
};
