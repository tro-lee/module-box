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
  // 糖
  id: Identifier;
  leadingComment: Comment | undefined;

  // 实际数据
  path: NodePath<FunctionDeclaration>;
  functionDeclaration: FunctionDeclaration & { id: Identifier };
};

export type InterfaceDeclarationWithComment = {
  // 糖
  id: Identifier;
  leadingComment: Comment | undefined;
  tsTypeElements: TSTypeElement[];

  // 实际数据
  path: NodePath<TSInterfaceDeclaration>;
  interfaceDeclaration: TSInterfaceDeclaration;
};

// 上下文相关 ==============================

export type FileContext = {
  interfacesWithComment: InterfaceDeclarationWithComment[];
  functionsWithComment: FunctionDeclarationWithComment[];
  importDeclarations: ImportDeclaration[];
};

export type GlobalContext = Map<string, FileContext>;

// 模块信息相关 =============================

export type ModuleComponent = {
  name: string;
  description: string;
  params: {
    name: string;
    description: string;
  }[];
};
