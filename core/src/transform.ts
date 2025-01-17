import { parse as parseComment } from "comment-parser";
import generate from "@babel/generator";
import {
  ComponentJSXElement,
  FileContext,
  FunctionDeclarationWithComment,
  ModuleComponent,
} from "./types";
import {
  parseExpressionToJSXElement,
  parseFunctionBody,
  parseTypeAnnotation,
} from "./parse";

// 判断是否是jsx组件
function isJSXFunctionComponent(
  functionDeclaration: FunctionDeclarationWithComment,
) {
  return functionDeclaration.functionDeclaration.body.type ===
      "BlockStatement" &&
    functionDeclaration.functionDeclaration.body.body.some((statement) =>
      statement.type === "ReturnStatement" &&
      (statement.argument?.type === "JSXElement" ||
        statement.argument?.type === "JSXFragment" ||
        (statement.argument?.type === "ConditionalExpression" &&
          (statement.argument?.consequent.type === "JSXElement" ||
            statement.argument?.consequent.type === "JSXFragment" ||
            statement.argument?.alternate.type === "JSXElement" ||
            statement.argument?.alternate.type === "JSXFragment")) ||
        (statement.argument?.type === "LogicalExpression" &&
          (statement.argument?.left.type === "JSXElement" ||
            statement.argument?.left.type === "JSXFragment" ||
            statement.argument?.right.type === "JSXElement" ||
            statement.argument?.right.type === "JSXFragment")))
    );
}

// 将元素声明转换为模块组件
async function transformElementDeclarationToModuleComponent(
  elementDeclaration: ComponentJSXElement["elementDeclaration"],
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
    const { functionDeclaration, leadingComment, context } = elementDeclaration;

    // 判断是否是jsx组件
    const isJsxComponent = isJSXFunctionComponent(elementDeclaration);
    if (!isJsxComponent) {
      console.log(elementDeclaration);
      console.error(
        `[${context.path} ${functionDeclaration.id.name}] 不是jsx组件`,
      );
      return;
    }

    // 拼出模块组件

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
      const componentParams = await Promise.all(
        functionDeclaration.params.map(async (param) => {
          // 解析解构类型声明 类似 {a}: {b} 的参数
          if (param.typeAnnotation) {
            return await parseTypeAnnotation(
              param.typeAnnotation,
              context,
            );
          }
        }),
      );

      const functionBody = await parseFunctionBody(functionDeclaration.body);

      let componentJSXElements: ComponentJSXElement[] = [];
      for (const statement of functionDeclaration.body.body) {
        if (
          statement.type === "ReturnStatement" && statement.argument
        ) {
          const result = await parseExpressionToJSXElement(
            statement.argument,
            context,
          );

          // 解析子组件
          for (const item of result) {
            const _item = item as ComponentJSXElement;
            _item.moduleComponent =
              await transformElementDeclarationToModuleComponent(
                _item.elementDeclaration,
              ) as ModuleComponent;

            if (!_item.moduleComponent) {
              console.error(
                `[${context.path} ${functionName}] 无法解析子组件: ${_item.elementName}`,
              );
              continue;
            }

            componentJSXElements.push(_item);
          }
        }
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
  context: FileContext,
) {
  const { functionsWithComment } = context;
  const moduleComponents: ModuleComponent[] = [];

  for (const functionWithComment of functionsWithComment) {
    try {
      const component = await transformElementDeclarationToModuleComponent(
        functionWithComment,
      );

      if (component) {
        moduleComponents.push(component);
      }
    } catch (error) {
      console.error(error);
    }
  }

  console.log(moduleComponents);
  return moduleComponents;
}
