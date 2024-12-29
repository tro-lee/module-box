import {
  ArrowFunctionExpression,
  Expression,
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
} from "./types";

const astContextCache: Record<string, FileContext> = {};

export async function scanAstByFile(
  filePath: string,
): Promise<FileContext | undefined> {
  const filename = path.resolve(__dirname, filePath);
  if (!fs.existsSync(filename)) {
    throw new Error("file not found: " + filename);
  }

  // 缓存逻辑
  if (filename in astContextCache) {
    return astContextCache[filename];
  }

  // 从文件中解析出 所要的语法树
  // importDeclaration, functionDeclaration, interfaceDeclaration

  let sourceCode: string;
  try {
    sourceCode = await Bun.file(filename).text();
  } catch (e) {
    console.error("file not found: " + filename);
    return;
  }

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

  const context: FileContext = {
    path: filename,
    interfacesWithComment,
    functionsWithComment,
    importDeclarations: imports,
  };

  traverse(ast, {
    ImportDeclaration(path: NodePath<ImportDeclaration>) {
      imports.push(path.node);
    },
    ArrowFunctionExpression(path: NodePath<ArrowFunctionExpression>) {
      // 保证解析是 解析的顶级域的初始化箭头函数
      // 然后伪装成FunctionDeclaration，我们不对箭头函数和函数进行细微区分
      if (
        path?.parentPath?.parentPath?.parentPath?.type !== "Program" ||
        path.key !== "init" ||
        path.parent.type !== "VariableDeclarator" ||
        path.parent.id.type !== "Identifier"
      ) {
        return;
      }

      const arrowFunction = path.node;
      const leadingComments = path.parent?.leadingComments;
      const leadingComment = leadingComments?.at(-1);

      // 将箭头函数体转换为块级语句
      if (arrowFunction.body.type !== "BlockStatement") {
        arrowFunction.body = {
          type: "BlockStatement",
          body: [{
            type: "ExpressionStatement",
            expression: arrowFunction.body as Expression,
          }],
          directives: [],
        };
      }

      functionsWithComment.push({
        type: "FunctionDeclarationWithComment",
        id: {
          type: "Identifier",
          name: path.parent.id.name,
        },
        leadingComment,
        nodePath: path,
        filePath: filename,
        context,
        functionDeclaration: {
          id: {
            type: "Identifier",
            name: path.parent.id.name,
          },
          body: arrowFunction.body,
          params: arrowFunction.params,
        },
      });
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
        type: "FunctionDeclarationWithComment",
        id,
        leadingComment,
        nodePath: path,
        filePath: filename,
        context,
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
        type: "InterfaceDeclarationWithComment",
        id,
        leadingComment,
        nodePath: path,
        filePath: filename,
        context,
        tsTypeElements: path.node.body.body,
        extendsExpression: path.node.extends ?? [],
        interfaceDeclaration: path.node,
      });
    },
  });

  astContextCache[filename] = context;

  return astContextCache[filename];
}
