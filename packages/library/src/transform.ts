import { parse as parseComment } from "comment-parser";
import {
  Component,
  ComponentJSXElement,
  Declaration,
  FileContext,
  Module,
} from "./types";
import {
  collectCustomBinding,
  collectComponentJSXElement,
  collectCustomTypeAnnotation,
} from "./collect";
import { getDeclarationInContext } from "./context";
import { scanAstByFileWithAutoExtension } from "./scan";

// 将组件转换为声明语句
// 注意：是直接生成新的声明语句
export async function transformComponentToDeclaration(
  component: Component
): Promise<Declaration | undefined> {
  if (component.type === "LocalComponent") {
    const fileContext = await scanAstByFileWithAutoExtension(
      component.componentFilePath
    );

    const functionDeclaration = fileContext?.functionsWithBaseInfo.find(
      (item) => item.functionDeclaration.id.name === component.componentName
    );

    return functionDeclaration;
  }

  if (component.type === "NodeComponent") {
    return {
      type: "NodeModuleImportDeclaration",
      id: {
        name: component.componentName,
        type: "Identifier",
      },
      filePath: component.packageName,
    };
  }
}

// 重要函数
// 将声明语句转换为组件
export async function transformDeclarationToComponent(
  declaration: Declaration
): Promise<Component | undefined> {
  if (declaration.type === "FunctionDeclarationWithBaseInfo") {
    const {
      functionDeclaration,
      jsxElementsWithNodePath,
      leadingComment,
      context,
      blockStateWithNodePath,
    } = declaration;

    // 判断是否是jsx组件
    const isJsxComponent = declaration.jsxElementsWithNodePath.length > 0;
    if (!isJsxComponent) {
      console.error(
        `[${context.path} ${functionDeclaration.id.name}] 不是jsx组件`
      );
      return;
    }

    try {
      const functionName = functionDeclaration.id.name;

      // 收集组件的注释
      let componentDescription = "";
      for (const item of parseComment("/*" + leadingComment?.value + "*/")) {
        item.tags.forEach((tag) => {
          if (tag.name === "description") {
            componentDescription = tag.name;
          }
        });
      }

      // 收集组件参数的类型注解
      const componentParams = (
        await Promise.all(
          functionDeclaration.params
            .filter((param) => param.type === "Identifier")
            .map((param) =>
              collectCustomTypeAnnotation(param.typeAnnotation, context)
            )
        )
      ).filter((item) => item !== undefined);

      // 收集组件的函数体
      const componentFunctionBody = await collectCustomBinding(
        blockStateWithNodePath,
        context
      );

      // 收集组件的JSX元素
      let componentJSXElements: ComponentJSXElement[] = (
        await Promise.all(
          jsxElementsWithNodePath.map((jsxElement) =>
            collectComponentJSXElement(jsxElement, context)
          )
        )
      ).filter((item): item is ComponentJSXElement => item !== undefined);

      // 去重
      componentJSXElements = Array.from(
        new Map(
          componentJSXElements.map((item) => [
            `${item.elementName}-${context.path}`,
            item,
          ])
        ).values()
      );

      const component: Component = {
        type: "LocalComponent",
        componentName: functionName,
        componentFilePath: context.path,
        componentKey: `${functionName}-${context.path}`,
        componentDescription,
        componentJSXElements,
        componentParams,
      };
      globalComponentContext[component.componentKey] = component;

      // 副作用
      // 顺便将jsx元素中的组件声明也转换为组件
      for (const jsxElement of componentJSXElements) {
        const declaration = await getDeclarationInContext(
          jsxElement.elementName,
          context
        );

        if (declaration) {
          const component = await transformDeclarationToComponent(declaration);
          if (component) {
            globalComponentContext[component.componentKey] = component;
          }
        }
      }

      return component;
    } catch (e) {
      console.error(e);
      return;
    }
  }

  if (declaration.type === "NodeModuleImportDeclaration") {
    const componentKey = `${declaration.id.name}-${declaration.filePath}`;

    globalComponentContext[componentKey] = {
      type: "NodeComponent",
      componentName: declaration.id.name,
      packageName: declaration.filePath,
      componentKey: componentKey,
    };
  }
}

let globalComponentContext: Record<string, Component> = {};
// 将文件上下文转换为模块和组件
async function transformFileContextToModuleAndComponent(
  context: FileContext,
  _globalComponentContext: Record<string, Component>
) {
  // 载入全局组件上下文
  globalComponentContext = _globalComponentContext;

  const modules: Module[] = [];
  for (const functionWithBaseInfo of context.functionsWithBaseInfo) {
    if (
      functionWithBaseInfo.nodePath.parent.type !== "ExportSpecifier" &&
      functionWithBaseInfo.nodePath.parent.type !== "ExportAllDeclaration" &&
      functionWithBaseInfo.nodePath.parent.type !== "ExportNamedDeclaration" &&
      functionWithBaseInfo.nodePath.parent.type !== "ExportDefaultDeclaration"
    ) {
      continue;
    }

    const component = await transformDeclarationToComponent(
      functionWithBaseInfo
    );
    if (!component || component.type !== "LocalComponent") {
      continue;
    }

    modules.push({
      type: "LocalModule",
      key: component.componentKey,
      componentFilePath: component.componentFilePath,
      componentName: component.componentName,
      componentKey: component.componentKey,
    });
  }

  return modules;
}

// ============================================
// 下面是暴露给外部的函数
// 外部提供文件路径后，即可拿到组件和模块信息
// ============================================

// 将单一文件路径转换为模块和组件
export async function transformFilePathToModuleAndComponent(filePath: string) {
  const fileContext = await scanAstByFileWithAutoExtension(filePath);
  if (!fileContext) return;

  const resultModules: Record<string, Module> = {};
  const resultComponentContext: Record<string, Component> = {};

  const modules = await transformFileContextToModuleAndComponent(
    fileContext,
    resultComponentContext
  );

  for (const module of modules) {
    resultModules[module.componentName] = module;
  }

  return {
    modules: resultModules,
    components: resultComponentContext,
  };
}

// 将文件路径列表转换为模块和组件
export async function transformFilePathsToModuleAndComponent(
  filePaths: string[]
) {
  const fileContexts: Record<string, FileContext> = {};
  for (const filePath of filePaths) {
    const fileContext = await scanAstByFileWithAutoExtension(filePath);
    if (!fileContext) continue;
    fileContexts[filePath] = fileContext;
  }

  const resultModules: Record<string, Module> = {};
  const resultComponentContext: Record<string, Component> = {};

  for (const fileContext of Object.values(fileContexts)) {
    const modules = await transformFileContextToModuleAndComponent(
      fileContext,
      resultComponentContext
    );
    for (const module of modules) {
      resultModules[module.componentName] = module;
    }
  }

  return {
    modules: resultModules,
    components: resultComponentContext,
  };
}
