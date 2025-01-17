import path from "path";
import {
  ComponentJSXElement,
  Declaration,
  FileContext,
  InterfaceDeclarationWithComment,
  NodeModuleImportDeclaration,
} from "./types";
import { scanAstByFileWithAutoExtension } from "./ast";
import { ImportDeclaration } from "@babel/types";

// 辅助函数 从导入声明中获取声明
function getTargetItemFromImportDeclarations(
  importDeclarations: ImportDeclaration[],
  itemName: string
): ImportDeclaration | undefined {
  return importDeclarations.find((importDeclaration) =>
    importDeclaration.specifiers.some(
      (specifier) =>
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

// 获取声明在一个上下文中
// 如果没有，则直接报错
async function getDeclarationInContextHelper(
  itemName: string,
  currentContext: FileContext,
  declarationType: "interface" | "function"
): Promise<Declaration | null> {
  // 从当前文件的变量声明 函数声明 接口声明中查找目标声明
  const declarations = [
    ...currentContext.variablesWithComment,
    ...(declarationType === "interface"
      ? currentContext.interfacesWithComment
      : currentContext.functionsWithComment),
  ];
  const item = declarations.find((item) => item.id.name === itemName);
  if (item) return item;

  // ==============================
  // 从当前文件的导入和导出声明中查找目标声明
  // ==============================

  // 从当前文件的导入声明中查找目标声明
  let targetImportDeclaration = getTargetItemFromImportDeclarations(
    currentContext.importDeclarations,
    itemName
  );

  // 从当前文件的导出声明中查找目标声明
  if (!targetImportDeclaration) {
    for (const exportAllDeclaration of currentContext.exportAllDeclarations) {
      // 获取导出声明所指向的上下文
      const absoluteTargetImportPath = path.resolve(
        currentContext.path,
        "../",
        exportAllDeclaration.source.value
      );
      const context = await scanAstByFileWithAutoExtension(
        absoluteTargetImportPath
      );
      if (!context) continue;

      // 从导出声明的上下文中，尝试拿取目标声明
      const declarations = [
        ...context.variablesWithComment,
        ...(declarationType === "interface"
          ? context.interfacesWithComment
          : context.functionsWithComment),
      ];
      const item = declarations.find((item) => item.id.name === itemName);
      if (item) return item;

      // 从导出声明的上下文中，尝试拿取导入声明
      targetImportDeclaration = getTargetItemFromImportDeclarations(
        context.importDeclarations,
        itemName
      );

      if (targetImportDeclaration) {
        currentContext = context;
        break;
      }
    }
  }

  // 若仍未找到，则报错
  if (!targetImportDeclaration) {
    console.error(
      `[${currentContext.path}] 未找到目标声明 ${itemName}, 可能暂且不能解析声明语句`
    );
    return null;
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
      targetImportDeclaration.source.value
    );

    // 获取目标上下文
    const targetContext = await scanAstByFileWithAutoExtension(
      absoluteTargetImportPath
    );
    if (!targetContext) {
      throw new Error(`[${currentContext.path}] 未找到目标声明 ${itemName}`);
    }

    // 若引入默认导出，则直接在此处判断了
    if (
      targetImportDeclaration.specifiers.some(
        (specifier) =>
          specifier.type === "ImportDefaultSpecifier" &&
          specifier.local.name === itemName
      )
    ) {
      if (declarationType === "interface") {
        const targetInterface =
          targetContext.interfacesWithComment.find(
            (item) => item.nodePath.parent.type === "ExportDefaultDeclaration"
          ) || null;
        return targetInterface;
      } else if (declarationType === "function") {
        const targetFunction =
          targetContext.functionsWithComment.find(
            (item) => item.nodePath.parent.type === "ExportDefaultDeclaration"
          ) || null;
        return targetFunction;
      }
    }

    return await getDeclarationInContextHelper(
      itemName,
      targetContext,
      declarationType
    );
  }

  console.error(`[${currentContext.path}] 未找到目标声明 ${itemName}`);
  return null;
}

export async function getInterfaceDeclarationInContext(
  itemName: string,
  currentContext: FileContext
): Promise<
  InterfaceDeclarationWithComment | NodeModuleImportDeclaration | null
> {
  const result = await getDeclarationInContextHelper(
    itemName,
    currentContext,
    "interface"
  );
  return result as any;
}

export async function getElementDeclarationInContext(
  itemName: string,
  currentContext: FileContext
): Promise<ComponentJSXElement["elementDeclaration"] | null> {
  const result = await getDeclarationInContextHelper(
    itemName,
    currentContext,
    "function"
  );
  return result as any;
}
