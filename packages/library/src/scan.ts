import {
  ArrowFunctionExpression,
  ExportAllDeclaration,
  Expression,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  TSInterfaceDeclaration,
  VariableDeclaration,
  VariableDeclarator,
  JSXElement,
  BlockStatement,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
} from "@babel/types";
import * as babel from "@babel/parser";
import { NodePath, ParseResult, traverse } from "@babel/core";
import path from "path";
import fs from "fs";
import { FileContext } from "./types";

const astContextCache: Record<string, FileContext> = {};

// 返回文件的上下文
async function scanAstByFile(filePath: string): Promise<FileContext> {
  // 缓存逻辑
  if (filePath in astContextCache) {
    return astContextCache[filePath];
  }

  // ==============================
  // 从文件中解析出 所要的语法树
  // ==============================

  let ast: ParseResult | null = null;

  const sourceCode = fs.readFileSync(filePath, "utf-8");

  try {
    ast = babel.parse(sourceCode, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });
  } catch (e) {
    throw new Error("解析失败: " + filePath + "\n" + e);
  }

  if (!ast) {
    throw new Error("AST parsing failed");
  }

  // ==============================
  // 根据语法树 填充上下文
  // ==============================

  const context: FileContext = {
    path: filePath,
    ast,
    interfacesWithBaseInfo: [],
    functionsWithBaseInfo: [],
    variablesWithBaseInfo: [],
    importDeclarationsWithNodePath: [],
    exportAllDeclarationsWithNodePath: [],
    exportNamedDeclarationsWithNodePath: [],
  };

  traverse(ast, {
    // 塞入声明
    ImportDeclaration(path: NodePath<ImportDeclaration>) {
      context.importDeclarationsWithNodePath.push(path);
    },
    ExportAllDeclaration(path: NodePath<ExportAllDeclaration>) {
      context.exportAllDeclarationsWithNodePath.push(path);
    },
    ExportDefaultDeclaration(path: NodePath<ExportDefaultDeclaration>) {
      context.exportDefaultDeclarationWithNodePath = path;
    },
    ExportNamedDeclaration(path: NodePath<ExportNamedDeclaration>) {
      context.exportNamedDeclarationsWithNodePath.push(path);
    },

    // 解析函数 箭头函数在这里也是函数
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
          body: [
            {
              type: "ExpressionStatement",
              expression: arrowFunction.body as Expression,
            },
          ],
          directives: [],
        };
      }

      const jsxElementsWithNodePath: NodePath<JSXElement>[] = [];
      let blockStateWithNodePath: NodePath<BlockStatement> | undefined =
        undefined;

      path.traverse({
        JSXElement(path: NodePath<JSXElement>) {
          jsxElementsWithNodePath.push(path);
        },
        BlockStatement(path: NodePath<BlockStatement>) {
          if (path.container === arrowFunction) {
            blockStateWithNodePath = path;
          }
        },
      });

      context.functionsWithBaseInfo.push({
        type: "FunctionDeclarationWithBaseInfo",
        isArrowFunction: true,
        nodePath: path,
        id: {
          type: "Identifier",
          name: path.parent.id.name,
        },
        leadingComment,
        filePath,
        context,
        functionDeclaration: {
          id: {
            type: "Identifier",
            name: path.parent.id.name,
          },
          body: arrowFunction.body,
          params: arrowFunction.params,
        },
        jsxElementsWithNodePath,
        blockStateWithNodePath: blockStateWithNodePath!,
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

      let leadingComments =
        path.parent?.leadingComments ?? path.node.leadingComments;
      const leadingComment = leadingComments?.at(-1);

      const jsxElementsWithNodePath: NodePath<JSXElement>[] = [];
      let blockStateWithNodePath: NodePath<BlockStatement> | undefined =
        undefined;

      path.traverse({
        JSXElement(path: NodePath<JSXElement>) {
          jsxElementsWithNodePath.push(path);
        },
        BlockStatement(path: NodePath<BlockStatement>) {
          if (path.key === "body") {
            blockStateWithNodePath = path;
          }
        },
      });

      context.functionsWithBaseInfo.push({
        type: "FunctionDeclarationWithBaseInfo",
        isArrowFunction: false,
        nodePath: path,
        id,
        leadingComment,
        filePath,
        context,
        functionDeclaration,
        jsxElementsWithNodePath,
        blockStateWithNodePath: blockStateWithNodePath!,
      });
    },
    // 解析接口
    TSInterfaceDeclaration(path: NodePath<TSInterfaceDeclaration>) {
      const id = path.node.id;
      if (!id) {
        console.warn("FunctionDeclaration has no id", path.node);
        return;
      }

      let leadingComments =
        path.parent?.leadingComments ?? path.node.leadingComments;
      const leadingComment = leadingComments?.at(-1);

      context.interfacesWithBaseInfo.push({
        type: "InterfaceDeclarationWithBaseInfo",
        id,
        leadingComment,
        nodePath: path,
        filePath,
        context,
        tsTypeElements: path.node.body.body,
        extendsExpression: path.node.extends ?? [],
        interfaceDeclaration: path.node,
      });
    },
    // 解析变量
    VariableDeclaration(path: NodePath<VariableDeclaration>) {
      path.traverse({
        VariableDeclarator(path: NodePath<VariableDeclarator>) {
          // 跳过变量为箭头函数的情况
          if (path.node.init?.type === "ArrowFunctionExpression") {
            return;
          }

          // 暂时只支持 变量声明
          if (path.node.id.type === "Identifier") {
            context.variablesWithBaseInfo.push({
              type: "VariableDeclaratorWithBaseInfo",
              id: path.node.id,
              filePath,
              context,
              variableDeclarator: path.node,
              nodePath: path,
            });
          }
        },
      });
    },
  });

  astContextCache[filePath] = context;
  return astContextCache[filePath];
}

// 扫描文件，返回文件的上下文
// 自动处理文件的扩展名
// 比如扫描 /XXX/X 视为 /XXX/X/index.ts
// 比如扫描 /XXX/X/hi 视为 /XXX/X/hi.ts
export async function scanAstByFileWithAutoExtension(
  filePath: string
): Promise<FileContext | null> {
  for (const ext of [
    "",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    "/index.ts",
    "/index.tsx",
    "/index.js",
    "/index.jsx",
  ]) {
    const _absoluteTargetImportPath = filePath + ext;
    if (
      !fs.existsSync(_absoluteTargetImportPath) ||
      !fs.statSync(_absoluteTargetImportPath).isFile()
    ) {
      continue;
    }

    try {
      return scanAstByFile(_absoluteTargetImportPath);
    } catch (error) {
      console.warn(error);
    }
  }

  return null;
}