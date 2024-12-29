import path from "path";
import fs from "fs";
import {
  FileContext,
  FunctionDeclarationWithComment,
  InterfaceDeclarationWithComment,
  NodeModuleImportDeclarationItem,
} from "./types";
import { scanAstByFile } from "./ast";

type Declaration =
  | InterfaceDeclarationWithComment
  | FunctionDeclarationWithComment
  | NodeModuleImportDeclarationItem;
type DeclarationContext<T extends Declaration> = {
  declaration: T;
  context: FileContext;
};

async function getDeclarationInContextHelper(
  itemName: string,
  currentContext: FileContext,
  declarationType: "interface" | "function",
): Promise<DeclarationContext<Declaration> | undefined> {
  // 从当前文件的声明中查找目标声明
  const declarations = declarationType === "interface"
    ? currentContext.interfacesWithComment
    : currentContext.functionsWithComment;
  const item = declarations.find((item) => item.id.name === itemName);
  if (item) return { declaration: item, context: currentContext };

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
      declaration: {
        type: "NodeModuleImportDeclarationItem",
        id: {
          type: "Identifier",
          name: itemName,
        },
        path: targetImportDeclaration.source.value,
      },
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

      targetContext = await scanAstByFile(
        _absoluteTargetImportPath,
      );
    }
    if (!targetContext) return undefined;

    return await getDeclarationInContextHelper(
      itemName,
      targetContext,
      declarationType,
    );
  }
}

export async function getInterfaceDeclarationInContext(
  itemName: string,
  currentContext: FileContext,
): Promise<
  DeclarationContext<
    InterfaceDeclarationWithComment | NodeModuleImportDeclarationItem
  > | undefined
> {
  const result = await getDeclarationInContextHelper(
    itemName,
    currentContext,
    "interface",
  );
  return result as
    | DeclarationContext<
      InterfaceDeclarationWithComment | NodeModuleImportDeclarationItem
    >
    | undefined;
}

export async function getFunctionDeclarationInContext(
  itemName: string,
  currentContext: FileContext,
): Promise<
  DeclarationContext<
    FunctionDeclarationWithComment | NodeModuleImportDeclarationItem
  > | undefined
> {
  const result = await getDeclarationInContextHelper(
    itemName,
    currentContext,
    "function",
  );
  return result as
    | DeclarationContext<
      FunctionDeclarationWithComment | NodeModuleImportDeclarationItem
    >
    | undefined;
}
