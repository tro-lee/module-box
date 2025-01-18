import path from "path";
import {
  ComponentJSXElement,
  Declaration,
  FileContext,
  InterfaceDeclarationWithComment,
  NodeModuleImportDeclaration,
} from "./types";
import { scanAstByFileWithAutoExtension } from "./ast";
import { ImportDeclaration, Identifier } from "@babel/types";
import { NodePath } from "@babel/traverse";

// 从导入声明中获取目标声明
// 用于解决导入导出问题
async function getDeclarationInImportDeclarationHelper(
  currentImportDeclaration: ImportDeclaration,
  currentContext: FileContext,
  itemName: string
): Promise<Declaration | null> {
  // 若查到为外部引用
  // TODO 暂时判定开头带@ 为全部索引
  if (currentImportDeclaration.source.value.startsWith("@")) {
    return {
      type: "NodeModuleImportDeclaration",
      id: {
        type: "Identifier",
        name: itemName,
      },
      filePath: currentImportDeclaration.source.value,
    };
  }

  // 若查到为项目内部引用
  if (currentImportDeclaration.source.value.startsWith(".")) {
    const absoluteTargetImportPath = path.resolve(
      currentContext.path,
      "../",
      currentImportDeclaration.source.value
    );

    const targetContext = await scanAstByFileWithAutoExtension(
      absoluteTargetImportPath
    );
    if (!targetContext) {
      console.warn(
        `[${absoluteTargetImportPath}] 未找到目标声明 ${itemName}, 可能暂且不能解析声明语句`
      );
      return null;
    }

    const isExportDefaultDeclaration = currentImportDeclaration.specifiers.some(
      (specifier) =>
        specifier.type === "ImportDefaultSpecifier" &&
        specifier.local.name === itemName
    );

    if (isExportDefaultDeclaration) {
      // 若引入默认导出，则直接在此处判断了
      if (!targetContext.exportDefaultDeclarationWithNodePath) {
        console.warn(
          `${targetContext.path} 没有默认导出声明，无法找到目标声明 ${itemName}`
        );
        return null;
      }

      let targetDeclaration: Declaration | null = null;
      targetContext.exportDefaultDeclarationWithNodePath.traverse({
        CallExpression(path) {
          console.log(path);
        },
        Identifier(path) {
          console.log(path);
        },
      });
    } else {
      // 若引入普通导出，则在这里做判断
      for (const exportNamedDeclaration of targetContext.exportNamedDeclarationsWithNodePath) {
        console.log(exportNamedDeclaration);
      }
      for (const exportAllDeclaration of targetContext.exportAllDeclarationsWithNodePath) {
        console.log(exportAllDeclaration);
      }
    }
  }

  console.warn(
    `[${currentContext.path}] 无法解析导入声明 ${currentImportDeclaration.source.value}`
  );
  return null;
}

// 获取声明在一个上下文中
// 如果没有，则直接报错
async function getDeclarationInContextHelper(
  itemName: string,
  currentContext: FileContext,
  declarationType: "interface" | "function"
): Promise<Declaration | null> {
  // 从当前文件的变量声明 函数声明/接口声明中查找目标声明
  const declarations = [
    ...currentContext.variablesWithComment,
    ...(declarationType === "interface"
      ? currentContext.interfacesWithComment
      : currentContext.functionsWithComment),
  ];
  const item = declarations.find((item) => item.id.name === itemName);
  if (item) return item;

  // 从当前文件的导入声明中查找目标声明
  let targetImportDeclaration: ImportDeclaration | null = null;
  currentContext.importDeclarationsWithNodePath.forEach((importDeclaration) => {
    importDeclaration.traverse({
      Identifier(path: NodePath<Identifier>) {
        if (path.node.name === itemName) {
          targetImportDeclaration = importDeclaration.node;
        }
      },
    });
  });

  // 解析导入声明
  if (!targetImportDeclaration) {
    console.warn(
      `[${currentContext.path}] 未找到目标声明 ${itemName}, 可能暂且不能解析声明语句`
    );

    return null;
  } else {
    return await getDeclarationInImportDeclarationHelper(
      targetImportDeclaration,
      currentContext,
      itemName
    );
  }
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
