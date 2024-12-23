import path from "path";
import fs from "fs";
import { ImportDeclaration } from "@babel/types";
import {
  FileContext,
  FunctionDeclarationWithComment,
  GlobalContext,
  InterfaceDeclarationWithComment,
  NodeModuleItem,
} from "./types";
import { scanAstByFile } from "./ast";

// 辅助函数：获取导入的别名
function getImportedAlias(specifier: any): string {
  if (specifier.type === "ImportSpecifier") {
    return specifier.local.name ?? specifier.imported.name;
  } else if (specifier.type === "ImportDefaultSpecifier") {
    return specifier.local.name;
  }
  return "";
}

// 辅助函数：获取导入的名称
function getImportedName(specifier: any): string {
  if (specifier.type === "ImportSpecifier") {
    return specifier.imported.name ?? specifier.local.name;
  } else if (specifier.type === "ImportDefaultSpecifier") {
    return specifier.local.name;
  }
  return "";
}

// 辅助函数：从引用中查找对应的接口
// export async function findParamInImportDeclaration(
//   importDeclarations: ImportDeclaration[],
//   paramType: string,
//   currentFilePath: string,
// ) {
//   for (const importAst of importDeclarations) {
//     for (const specifier of importAst.specifiers) {
//       const importedAlias = getImportedAlias(specifier);
//       const importedName = getImportedName(specifier);
//       if (importedAlias !== paramType) continue;

//       // TODO importAST 可能会出现@/ 这种路径 还需要进一步处理
//       // 现在只能用于相对和绝对路径
//       const importPath = path.resolve(
//         path.dirname(currentFilePath),
//         importAst.source.value,
//       );

//       // 按需分析导入的文件
//       const extensions = ["", ".ts", ".tsx", ".js", ".jsx"];
//       for (const ext of extensions) {
//         const realImportPath = importPath + ext;
//         if (
//           !fs.existsSync(realImportPath) ||
//           !fs.statSync(realImportPath).isFile()
//         ) {
//           continue;
//         }

//         const analyzer = await ASTAnalyzer.scan(realImportPath);
//         const { interfaceDeclarations, functionDeclarations } =
//           analyzer.context;

//         const found = interfaceDeclarations.find(
//           (item) => item.name === importedName,
//         ) ?? functionDeclarations.find(
//           (item) => item.name === importedName,
//         );

//         return found;
//       }
//     }
//   }
// }

async function getDeclarationInContextHelper(
  itemName: string,
  currentContext: FileContext,
  globalContext: GlobalContext,
  declarationType: "interface" | "function",
): Promise<
  | InterfaceDeclarationWithComment
  | FunctionDeclarationWithComment
  | NodeModuleItem
  | undefined
> {
  if (currentContext.type === "NodeModuleFileContext") {
    return undefined;
  }

  // 从当前文件的声明中查找目标声明
  const declarations = declarationType === "interface"
    ? currentContext.interfacesWithComment
    : currentContext.functionsWithComment;
  const item = declarations.find((item) => item.id.name === itemName);
  if (item) return item;

  // 从当前文件的导入声明中查找目标声明
  const { importDeclarations } = currentContext;
  const targetImportDeclaration = importDeclarations.find((item) =>
    item.specifiers.some((specifier) =>
      (specifier.type === "ImportSpecifier" &&
        specifier.local.name === itemName) ||
      (specifier.type === "ImportSpecifier" &&
        specifier.imported.type === "Identifier" &&
        specifier.imported.name === itemName) ||
      (specifier.type === "ImportDefaultSpecifier" &&
        specifier.local.name === itemName)
    )
  );
  if (!targetImportDeclaration) return undefined;

  // 从全局上下文中获取目标文件的上下文
  let targetContext = globalContext.get(
    targetImportDeclaration.source.value,
  );

  // 如果目标上下文不存在，则需要从全局上下文中获取
  if (!targetContext) {
    if (targetImportDeclaration.source.value.startsWith("@")) {
      targetContext = {
        type: "NodeModuleFileContext",
        path: targetImportDeclaration.source.value,
      };
    } else {
      let importPath = path.resolve(
        currentContext.path,
        "../",
        targetImportDeclaration.source.value,
      );
      const extensions = ["", ".ts", ".tsx", ".js", ".jsx"];
      for (const ext of extensions) {
        const realImportPath = importPath + ext;
        if (
          !fs.existsSync(realImportPath) ||
          !fs.statSync(realImportPath).isFile()
        ) {
          continue;
        }

        targetContext = await scanAstByFile(
          realImportPath,
        );
      }
    }
  }

  if (!targetContext) return undefined;

  if (targetContext.type === "NodeModuleFileContext") {
    return {
      type: "NodeModuleItem",
      id: {
        type: "Identifier",
        name: itemName,
      },
      path: targetImportDeclaration.source.value,
    };
  }

  if (targetContext.type === "LocalFileContext") {
    // 从本地上下文中 找到目标
    const declarations = declarationType === "interface"
      ? targetContext.interfacesWithComment
      : targetContext.functionsWithComment;
    const item = declarations.find((item) => item.id.name === itemName);

    return item ??
      getDeclarationInContextHelper(
        itemName,
        targetContext,
        globalContext,
        declarationType,
      );
  }
}

export async function getInterfaceDeclarationInContext(
  itemName: string,
  currentContext: FileContext,
  globalContext: GlobalContext,
): Promise<InterfaceDeclarationWithComment | NodeModuleItem | undefined> {
  return getDeclarationInContextHelper(
    itemName,
    currentContext,
    globalContext,
    "interface",
  ) as Promise<InterfaceDeclarationWithComment | NodeModuleItem | undefined>;
}

export async function getFunctionDeclarationInContext(
  itemName: string,
  currentContext: FileContext,
  globalContext: GlobalContext,
): Promise<FunctionDeclarationWithComment | NodeModuleItem | undefined> {
  return getDeclarationInContextHelper(
    itemName,
    currentContext,
    globalContext,
    "function",
  ) as Promise<FunctionDeclarationWithComment | NodeModuleItem | undefined>;
}
