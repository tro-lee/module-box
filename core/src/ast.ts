import {
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  TSInterfaceDeclaration,
} from "@babel/types";
import { NodePath, parse, traverse } from "@babel/core";
import path from "path";
import fs from "fs";
import {
  FileContext,
  FunctionDeclarationWithComment,
  InterfaceDeclarationWithComment,
} from "./core";

const astAnalyzerCache: Record<string, FileContext> = {};

export async function scanAstByFile(filePath: string) {
  const filename = path.resolve(__dirname, filePath);
  if (!fs.existsSync(filename)) {
    throw new Error("File not found");
  }

  // 缓存逻辑
  if (filename in astAnalyzerCache) {
    return astAnalyzerCache[filename];
  }

  // 从文件中解析出 所要的语法树
  // importDeclaration, functionDeclaration, interfaceDeclaration

  const sourceCode = await Bun.file(filename).text();
  const ast = parse(sourceCode, {
    filename,
    sourceType: "module",
    plugins: ["@babel/plugin-syntax-import-source"],
    presets: ["@babel/preset-typescript", "@babel/preset-react"],
  });

  if (!ast) {
    throw new Error("AST parsing failed");
  }

  const imports: ImportDeclaration[] = [];
  const functionsWithComment: FunctionDeclarationWithComment[] = [];
  const interfacesWithComment: InterfaceDeclarationWithComment[] = [];

  traverse(ast, {
    ImportDeclaration(path: NodePath<ImportDeclaration>) {
      imports.push(path.node);
    },
    FunctionDeclaration(path: NodePath<FunctionDeclaration>) {
      const id = path.node.id;
      if (!id) {
        console.warn("FunctionDeclaration has no id", path.node);
        return;
      }
      const functionDeclaration = path.node as FunctionDeclaration & {
        id: Identifier;
      };

      let leadingComments = path.parent?.leadingComments ??
        path.node.leadingComments;
      const leadingComment = leadingComments?.at(-1);

      functionsWithComment.push({
        id,
        leadingComment,
        path,
        functionDeclaration,
      });
    },
    TSInterfaceDeclaration(path: NodePath<TSInterfaceDeclaration>) {
      const id = path.node.id;
      if (!id) {
        console.warn("FunctionDeclaration has no id", path.node);
        return;
      }

      let leadingComments = path.parent?.leadingComments ??
        path.node.leadingComments;
      const leadingComment = leadingComments?.at(-1);

      interfacesWithComment.push({
        id,
        leadingComment,
        path,
        tsTypeElements: path.node.body.body,
        interfaceDeclaration: path.node,
      });
    },
  });

  astAnalyzerCache[filename] = {
    interfacesWithComment,
    functionsWithComment,
    importDeclarations: imports,
  };

  return astAnalyzerCache[filename];
}
