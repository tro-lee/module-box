import { parse as parseComment } from "comment-parser";
import generate from "@babel/generator";
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
  collectCssStyles,
} from "./collect";
import { getDeclarationInContext } from "./context";
import { scanAstByFileWithAutoExtension } from "./scan";

// 将函数声明转换为组件
async function transformElementDeclarationToComponent(
  elementDeclaration: Declaration
): Promise<Component | undefined> {
  if (elementDeclaration.type === "FunctionDeclarationWithBaseInfo") {
    const {
      functionDeclaration,
      jsxElementsWithNodePath,
      leadingComment,
      context,
      blockStateWithNodePath,
    } = elementDeclaration;

    // 判断是否是jsx组件
    const isJsxComponent =
      elementDeclaration.jsxElementsWithNodePath.length > 0;
    if (!isJsxComponent) {
      console.error(
        `[${context.path} ${functionDeclaration.id.name}] 不是jsx组件`
      );
      return;
    }

    try {
      const functionName = functionDeclaration.id.name;

      let componentDescription = "";
      for (const item of parseComment("/*" + leadingComment?.value + "*/")) {
        item.tags.forEach((tag) => {
          if (tag.name === "description") {
            componentDescription = tag.name;
          }
        });
      }

      // 收集所有自定义类型注解
      const componentParams = (
        await Promise.all(
          functionDeclaration.params
            .filter((param) => param.type === "Identifier")
            .map((param) =>
              collectCustomTypeAnnotation(param.typeAnnotation, context)
            )
        )
      ).filter((item) => item !== undefined);

      const componentFunctionBody = await collectCustomBinding(
        blockStateWithNodePath,
        context
      );

      // 去重收集JSX元素
      const componentJSXElements: ComponentJSXElement[] = Array.from(
        new Map(
          (
            await Promise.all(
              jsxElementsWithNodePath.map((jsxElement) =>
                collectComponentJSXElement(jsxElement, context)
              )
            )
          )
            .filter((item): item is ComponentJSXElement => item !== undefined)
            .map((item) => [`${item.elementName}-${context.path}`, item])
        ).values()
      );

      const componentCssStyles = await collectCssStyles(context);

      const component: Component = {
        type: "LocalComponent",
        componentName: functionName,
        componentFilePath: context.path,
        componentKey: `${functionName}-${context.path}`,
        componentDescription,
        componentJSXElements,
        componentParams,
        componentCssStyles,
      };
      globalComponentContext.set(component.componentKey, component);

      // 副作用
      // 顺便将jsx元素中的组件声明也转换为组件
      for (const jsxElement of componentJSXElements) {
        const declaration = await getDeclarationInContext(
          jsxElement.elementName,
          context
        );

        if (declaration) {
          const component = await transformElementDeclarationToComponent(
            declaration
          );
          if (component) {
            globalComponentContext.set(component.componentKey, component);
          }
        }
      }

      return component;
    } catch (e) {
      console.error(e);
      return;
    }
  }

  if (elementDeclaration.type === "NodeModuleImportDeclaration") {
    const componentKey = `${elementDeclaration.id.name}-${elementDeclaration.filePath}`;

    globalComponentContext.set(componentKey, {
      type: "NodeComponent",
      componentName: elementDeclaration.id.name,
      packageName: elementDeclaration.filePath,
      componentKey: componentKey,
    });
  }
}

// 将组件转换为函数声明
export async function transformComponentToDeclaration(
  component: Component
): Promise<Declaration | undefined> {
  if (component.type === "LocalComponent") {
    const fileContext = await scanAstByFileWithAutoExtension(
      component.componentFilePath
    );
    if (!fileContext) {
      return;
    }

    const functionDeclaration = fileContext.functionsWithBaseInfo.find(
      (item) => item.functionDeclaration.id.name === component.componentName
    );
    if (!functionDeclaration) {
      return;
    }

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

// 将元素声明转换为模块
async function transformElementDeclarationToModule(
  elementDeclaration: Declaration
): Promise<Module | undefined> {
  if (elementDeclaration.type === "NodeModuleImportDeclaration") {
    return {
      type: "NodeModule",
      componentName: elementDeclaration.id.name,
      packageName: elementDeclaration.filePath,
    };
  }

  if (elementDeclaration.type === "VariableDeclaratorWithBaseInfo") {
    const sourceCode = generate(elementDeclaration.variableDeclarator);
    return {
      type: "UnknownModule",
      componentName: elementDeclaration.id.name,
      sourceCode: sourceCode.code,
    };
  }

  if (elementDeclaration.type === "FunctionDeclarationWithBaseInfo") {
    const component = await transformElementDeclarationToComponent(
      elementDeclaration
    );

    // 若出问题
    if (!component || component.type !== "LocalComponent") {
      return;
    }

    return {
      type: "LocalModule",
      componentFilePath: component.componentFilePath,
      componentName: component.componentName,
      componentKey: component.componentKey,
    };
  }
}

let globalComponentContext: Map<string, Component> = new Map();

// 将文件上下文转换为模块和组件
// 识别上下文中的所有元素声明
async function transformFileContextToModuleAndComponent(
  context: FileContext,
  _globalComponentContext: Map<string, Component>
) {
  // 将老的组件上下文转入新的组件上下文
  if (_globalComponentContext !== globalComponentContext) {
    globalComponentContext.forEach((component, key) => {
      _globalComponentContext.set(key, component);
    });
    globalComponentContext = _globalComponentContext;
  }

  const moduleComponents: Module[] = [];

  try {
    for (const functionWithBaseInfo of context.functionsWithBaseInfo) {
      const component = await transformElementDeclarationToModule(
        functionWithBaseInfo
      );

      if (component) {
        moduleComponents.push(component);
      }
    }
  } catch (error) {
    console.error(error);
  }

  return moduleComponents;
}

// 将文件路径转换为模块和组件
export async function transformFilePathsToModuleAndComponent(
  filePaths: string[]
) {
  const fileContexts: Map<string, FileContext> = new Map();
  for (const filePath of filePaths) {
    const fileContext = await scanAstByFileWithAutoExtension(filePath);
    if (!fileContext) continue;
    fileContexts.set(filePath, fileContext);
  }

  const resultModules: Map<string, Module> = new Map();
  const resultComponentContext = new Map<string, Component>();

  for (const fileContext of fileContexts.values()) {
    const modules = await transformFileContextToModuleAndComponent(
      fileContext,
      resultComponentContext
    );
    for (const module of modules) {
      resultModules.set(module.componentName, module);
    }
  }

  return {
    modules: resultModules,
    components: resultComponentContext,
  };
}
