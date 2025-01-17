import {
  ArrowFunctionExpression,
  ExportAllDeclaration,
  Expression,
  FunctionDeclaration,
  Identifier,
  ImportDeclaration,
  TSInterfaceDeclaration,
  VariableDeclaration,
} from "@babel/types";
import { NodePath, parse, ParseResult, traverse } from "@babel/core";
import path from "path";
import fs from "fs";
import { FileContext } from "./types";

const astContextCache: Record<string, FileContext> = {};

// 返回文件的上下文
async function scanAstByFile(
  filePath: string,
): Promise<FileContext> {
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
    const sourceCode = await Bun.file(filename).text();

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
  // 根据语法术 填充上下文
  // ==============================

  const context: FileContext = {
    path: filename,
    interfacesWithComment: [],
    functionsWithComment: [],
    variablesWithComment: [],
    importDeclarations: [],
    exportAllDeclarations: [],
  };

  traverse(ast, {
    ImportDeclaration(path: NodePath<ImportDeclaration>) {
      context.importDeclarations.push(path.node);
    },
    ExportAllDeclaration(path: NodePath<ExportAllDeclaration>) {
      context.exportAllDeclarations.push(path.node);
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
          body: [{
            type: "ExpressionStatement",
            expression: arrowFunction.body as Expression,
          }],
          directives: [],
        };
      }

      context.functionsWithComment.push({
        type: "FunctionDeclarationWithComment",
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

      context.functionsWithComment.push({
        type: "FunctionDeclarationWithComment",
        id,
        leadingComment,
        filePath: filename,
        context,
        functionDeclaration,
      });
    },
    // 解析接口
    TSInterfaceDeclaration(path: NodePath<TSInterfaceDeclaration>) {
      const id = path.node.id;
      if (!id) {
        console.warn("FunctionDeclaration has no id", path.node);
        return;
      }

      let leadingComments = path.parent?.leadingComments ??
        path.node.leadingComments;
      const leadingComment = leadingComments?.at(-1);

      context.interfacesWithComment.push({
        type: "InterfaceDeclarationWithComment",
        id,
        leadingComment,
        filePath: filename,
        context,
        tsTypeElements: path.node.body.body,
        extendsExpression: path.node.extends ?? [],
        interfaceDeclaration: path.node,
      });
    },
    // 解析变量
    VariableDeclaration(path: NodePath<VariableDeclaration>) {
      // 跳过变量为箭头函数的情况
      // 用于做一些奇怪的变量形式 jsx
      for (const declaration of path.node.declarations) {
        if (declaration.init?.type === "ArrowFunctionExpression") {
          return;
        }

        // 暂时只支持 变量声明
        if (declaration.id.type === "Identifier") {
          context.variablesWithComment.push({
            type: "VariableDeclaratorWithComment",
            id: declaration.id,
            filePath: filename,
            context,
            variableDeclarator: declaration,
          });
        }
      }
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
  filePath: string,
): Promise<FileContext | null> {
  for (
    const ext of [
      "",
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      "/index.ts",
      "/index.tsx",
      "/index.js",
      "/index.jsx",
    ]
  ) {
    const _absoluteTargetImportPath = filePath + ext;
    if (
      !fs.existsSync(_absoluteTargetImportPath) ||
      !fs.statSync(_absoluteTargetImportPath).isFile()
    ) {
      continue;
    }

    try {
      return await scanAstByFile(
        _absoluteTargetImportPath,
      );
    } catch (error) {
      console.error(error);
    }
  }

  return null;
}
