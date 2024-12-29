import path from "path";
import fs from "fs";
import {
  FileContext,
  FunctionDeclarationWithComment,
  InterfaceDeclarationWithComment,
  NodeModuleImportDeclaration,
} from "./types";
import { scanAstByFile } from "./ast";

type Declaration =
  | InterfaceDeclarationWithComment
  | FunctionDeclarationWithComment
  | NodeModuleImportDeclaration;

async function getDeclarationInContextHelper(
  itemName: string,
  currentContext: FileContext,
  declarationType: "interface" | "function",
): Promise<Declaration> {
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
  if (!targetImportDeclaration) {
    throw new Error(
      `[${currentContext.path}] 未找到目标声明 ${itemName}`,
    );
  }

  // 若查到为外部引用
  // TODO 暂时判定开头带@ 为全部索引
  if (targetImportDeclaration.source.value.startsWith("@")) {
    return {
      type: "NodeModuleImportDeclaration",
      id: {
        type: "Identifier",
        name: itemName,
      },
      filePath: targetImportDeclaration.source.value,
      nodePath: targetImportDeclaration,
      context: currentContext,
    };
  }

  // 若查到为项目内部引用
  if (targetImportDeclaration.source.value.startsWith(".")) {
    const absoluteTargetImportPath = path.resolve(
      currentContext.path,
      "../",
      targetImportDeclaration.source.value,
    );

    // 获取目标上下文
    let targetContext: FileContext | undefined;
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
      const _absoluteTargetImportPath = absoluteTargetImportPath + ext;
      if (
        !fs.existsSync(_absoluteTargetImportPath) ||
        !fs.statSync(_absoluteTargetImportPath).isFile()
      ) {
        continue;
      }

      try {
        targetContext = await scanAstByFile(
          _absoluteTargetImportPath,
        );
      } catch (error) {
        console.error(error);
      }
    }

    if (!targetContext) {
      throw new Error(
        `[${currentContext.path}] 未找到目标声明 ${itemName}`,
      );
    }

    return await getDeclarationInContextHelper(
      itemName,
      targetContext,
      declarationType,
    );
  }

  throw new Error(
    `[${currentContext.path}] 未找到目标声明 ${itemName}`,
  );
}

export async function getInterfaceDeclarationInContext(
  itemName: string,
  currentContext: FileContext,
): Promise<
  InterfaceDeclarationWithComment | NodeModuleImportDeclaration
> {
  const result = await getDeclarationInContextHelper(
    itemName,
    currentContext,
    "interface",
  );
  return result as
    | InterfaceDeclarationWithComment
    | NodeModuleImportDeclaration;
}

export async function getFunctionDeclarationInContext(
  itemName: string,
  currentContext: FileContext,
): Promise<
  FunctionDeclarationWithComment | NodeModuleImportDeclaration
> {
  const result = await getDeclarationInContextHelper(
    itemName,
    currentContext,
    "function",
  );
  return result as
    | FunctionDeclarationWithComment
    | NodeModuleImportDeclaration;
}
