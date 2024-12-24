import path from "path";
import fs from "fs";
import {
  FileContext,
  FunctionDeclarationWithComment,
  GlobalContext,
  InterfaceDeclarationWithComment,
  NodeModuleImportDeclarationItem,
} from "./types";
import { scanAstByFile } from "./ast";

async function getDeclarationInContextHelper(
  itemName: string,
  currentContext: FileContext,
  globalContext: GlobalContext,
  declarationType: "interface" | "function",
): Promise<
  | InterfaceDeclarationWithComment
  | FunctionDeclarationWithComment
  | NodeModuleImportDeclarationItem
  | undefined
> {
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

  // 若查到为外部引用
  // TODO 暂时判定开头带@ 为全部索引
  if (targetImportDeclaration.source.value.startsWith("@")) {
    return {
      type: "NodeModuleImportDeclarationItem",
      id: {
        type: "Identifier",
        name: itemName,
      },
      path: targetImportDeclaration.source.value,
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
    let targetContext;
    for (const ext of ["", ".ts", ".tsx", ".js", ".jsx"]) {
      const _absoluteTargetImportPath = absoluteTargetImportPath + ext;
      if (
        !fs.existsSync(_absoluteTargetImportPath) ||
        !fs.statSync(_absoluteTargetImportPath).isFile()
      ) {
        continue;
      }

      targetContext = globalContext.get(_absoluteTargetImportPath) ??
        await scanAstByFile(
          _absoluteTargetImportPath,
        );
    }
    if (!targetContext) return undefined;

    return getDeclarationInContextHelper(
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
): Promise<
  InterfaceDeclarationWithComment | NodeModuleImportDeclarationItem | undefined
> {
  return getDeclarationInContextHelper(
    itemName,
    currentContext,
    globalContext,
    "interface",
  ) as Promise<
    | InterfaceDeclarationWithComment
    | NodeModuleImportDeclarationItem
    | undefined
  >;
}

export async function getFunctionDeclarationInContext(
  itemName: string,
  currentContext: FileContext,
  globalContext: GlobalContext,
): Promise<
  FunctionDeclarationWithComment | NodeModuleImportDeclarationItem | undefined
> {
  return getDeclarationInContextHelper(
    itemName,
    currentContext,
    globalContext,
    "function",
  ) as Promise<
    FunctionDeclarationWithComment | NodeModuleImportDeclarationItem | undefined
  >;
}
