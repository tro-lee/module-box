import path from "path";
import {
  FileContext,
  FunctionDeclarationWithComment,
  InterfaceDeclarationWithComment,
  NodeModuleImportDeclaration,
} from "./types";
import { scanAstByFileWithAutoExtension } from "./ast";
import { ImportDeclaration } from "@babel/types";

// 辅助函数 从导入声明中获取声明
function getTargetItemFromImportDeclarations(
  importDeclarations: ImportDeclaration[],
  itemName: string,
): ImportDeclaration | undefined {
  return importDeclarations.find((importDeclaration) =>
    importDeclaration.specifiers.some((
      specifier,
    ) =>
      (specifier.type === "ImportSpecifier" &&
        specifier.local.name === itemName) ||
      (specifier.type === "ImportSpecifier" &&
        specifier.imported.type === "Identifier" &&
        specifier.imported.name === itemName) ||
      (specifier.type === "ImportDefaultSpecifier" &&
        specifier.local.name === itemName)
    )
  );
}

type Declaration =
  | InterfaceDeclarationWithComment
  | FunctionDeclarationWithComment
  | NodeModuleImportDeclaration;

// 获取声明在一个上下文中
// 如果没有，则直接报错
async function getDeclarationInContextHelper(
  itemName: string,
  currentContext: FileContext,
  declarationType: "interface" | "function",
): Promise<Declaration> {
  // 从当前文件的接口或函数声明中查找目标声明
  const declarations = declarationType === "interface"
    ? currentContext.interfacesWithComment
    : currentContext.functionsWithComment;
  const item = declarations.find((item) => item.id.name === itemName);
  if (item) return item;

  // ==============================
  // 从当前文件的导入和导出声明中查找目标声明
  // ==============================

  // 从当前文件的导入声明中查找目标声明
  let targetImportDeclaration = getTargetItemFromImportDeclarations(
    currentContext.importDeclarations,
    itemName,
  );

  // 从当前文件的导出声明中查找目标声明
  if (!targetImportDeclaration) {
    for (const exportAllDeclaration of currentContext.exportAllDeclarations) {
      const absoluteTargetImportPath = path.resolve(
        currentContext.path,
        "../",
        exportAllDeclaration.source.value,
      );

      const context = await scanAstByFileWithAutoExtension(
        absoluteTargetImportPath,
      );
      if (!context) continue;

      const declarations = context[
        declarationType === "interface"
          ? "interfacesWithComment"
          : "functionsWithComment"
      ];
      const item = declarations.find((item) => item.id.name === itemName);
      if (item) return item;

      targetImportDeclaration = getTargetItemFromImportDeclarations(
        context.importDeclarations,
        itemName,
      );

      if (targetImportDeclaration) {
        currentContext = context;
        break;
      }
    }
  }

  // 若寻找导入和导出后仍未找到，则报错
  if (!targetImportDeclaration) {
    throw new Error(
      `[${currentContext.path}] 未找到目标声明 ${itemName}`,
    );
  }

  // ==============================
  // 根据引用类型，进一步解析
  // ==============================

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
      context: currentContext,
    };
  }

  // 若查到为项目内部引用
  // 则递归获取目标声明
  if (targetImportDeclaration.source.value.startsWith(".")) {
    const absoluteTargetImportPath = path.resolve(
      currentContext.path,
      "../",
      targetImportDeclaration.source.value,
    );

    // 获取目标上下文
    const targetContext = await scanAstByFileWithAutoExtension(
      absoluteTargetImportPath,
    );

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
  try {
    const result = await getDeclarationInContextHelper(
      itemName,
      currentContext,
      "interface",
    );
    return result as
      | InterfaceDeclarationWithComment
      | NodeModuleImportDeclaration;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getFunctionDeclarationInContext(
  itemName: string,
  currentContext: FileContext,
): Promise<
  FunctionDeclarationWithComment | NodeModuleImportDeclaration
> {
  try {
    const result = await getDeclarationInContextHelper(
      itemName,
      currentContext,
      "function",
    );
    return result as
      | FunctionDeclarationWithComment
      | NodeModuleImportDeclaration;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
