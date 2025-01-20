import { parse as parseComment } from "comment-parser";
import generate from "@babel/generator";
import {
  ComponentJSXElement,
  FileContext,
  ModuleComponent,
} from "./types";
import {
  parseJSXElementWithNodePath,
  parseTypeAnnotation,
} from "./parse";

// 将元素声明转换为模块组件
async function transformElementDeclarationToModuleComponent(
  elementDeclaration: ComponentJSXElement["elementDeclaration"]
): Promise<ModuleComponent | undefined> {
  if (elementDeclaration.type === "NodeModuleImportDeclaration") {
    return {
      type: "NodeModuleComponent",
      componentName: elementDeclaration.id.name,
      packageName: elementDeclaration.filePath,
    };
  }

  if (elementDeclaration.type === "VariableDeclaratorWithComment") {
    const sourceCode = generate(elementDeclaration.variableDeclarator);
    return {
      type: "UnknownComponent",
      componentName: elementDeclaration.id.name,
      sourceCode: sourceCode.code,
    };
  }

  if (elementDeclaration.type === "FunctionDeclarationWithComment") {
    const {
      functionDeclaration,
      jsxElementsWithNodePath,
      leadingComment,
      context,
      functionBodyWithNodePath,
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

    const functionName = functionDeclaration.id.name;
    const comment = parseComment("/*" + leadingComment?.value + "*/");
    let componentDescription = "";
    for (const item of comment) {
      item.tags.forEach((tag) => {
        if (tag.name === "description") {
          componentDescription = tag.name;
        }
      });
    }

    try {
      const componentParams = (
        await Promise.all(
          functionDeclaration.params
            .filter((param) => param.type === "Identifier")
            .map((param) => parseTypeAnnotation(param.typeAnnotation, context))
        )
      ).filter((item) => item !== undefined);

      // const functionBody = await parseFunctionBodyWithNodePath(
      //   functionBodyWithNodePath
      // );

      const componentJSXElements: ComponentJSXElement[] = (
        await Promise.all(
          jsxElementsWithNodePath.map((jsxElement) =>
            parseJSXElementWithNodePath(jsxElement, context)
          )
        )
      ).filter((item) => item !== undefined);
      for (const componentJSXElement of componentJSXElements) {
        const component = await transformElementDeclarationToModuleComponent(
          componentJSXElement.elementDeclaration
        );
        componentJSXElement.moduleComponent = component;
      }

      return {
        type: "LocalModuleComponent",
        componentName: functionName,
        componentDescription,
        componentJSXElements,
        componentParams,
      };
    } catch (e) {
      console.error(e);
    }
  }
}

// 将文件上下文转换为模块组件
// 识别上下文中的所有元素声明
export async function transformFileContextToModuleComponent(
  context: FileContext
) {
  const { functionsWithComment } = context;
  const moduleComponents: ModuleComponent[] = [];

  for (const functionWithComment of functionsWithComment) {
    try {
      const component = await transformElementDeclarationToModuleComponent(
        functionWithComment
      );

      if (component) {
        moduleComponents.push(component);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return moduleComponents;
}