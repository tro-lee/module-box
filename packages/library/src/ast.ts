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
import { NodePath, parse, ParseResult, traverse } from "@babel/core";
import path from "path";
import fs from "fs";
import { FileContext } from "./types";

const astContextCache: Record<string, FileContext> = {};

// 返回文件的上下文
async function scanAstByFile(filePath: string): Promise<FileContext> {
  const filename = path.resolve(__dirname, filePath);
  if (!fs.existsSync(filename)) {
    throw new Error("file not found: " + filename);
  }

  // 缓存逻辑
  if (filename in astContextCache) {
    return astContextCache[filename];
  }

  // ==============================
  // 从文件中解析出 所要的语法树
  // ==============================

  let ast: ParseResult | null = null;
  try {
    const sourceCode = await fs.promises.readFile(filename, 'utf-8');

    ast = parse(sourceCode, {
      filename,
      sourceType: "module",
      plugins: ["@babel/plugin-syntax-import-source"],
      presets: ["@babel/preset-typescript", "@babel/preset-react"],
    });
  } catch (e) {
    throw new Error("file not found: " + filename);
  }

  if (!ast) {
    throw new Error("AST parsing failed");
  }

  // ==============================
  // 根据语法树 填充上下文
  // ==============================

  const context: FileContext = {
    path: filename,
    ast,
    interfacesWithComment: [],
    functionsWithComment: [],
    variablesWithComment: [],
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

      context.functionsWithComment.push({
        type: "FunctionDeclarationWithComment",
        isArrowFunction: true,
        nodePath: path,
        id: {
          type: "Identifier",
          name: path.parent.id.name,
        },
        leadingComment,
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

      context.functionsWithComment.push({
        type: "FunctionDeclarationWithComment",
        isArrowFunction: false,
        nodePath: path,
        id,
        leadingComment,
        filePath: filename,
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

      context.interfacesWithComment.push({
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
            context.variablesWithComment.push({
              type: "VariableDeclaratorWithComment",
              id: path.node.id,
              filePath: filename,
              context,
              variableDeclarator: path.node,
              nodePath: path,
            });
          }
        },
      });
    },
  });

  astContextCache[filename] = context;

  return astContextCache[filename];
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
