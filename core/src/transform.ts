import { parse as parseComment } from "comment-parser";
import { FileContext, ModuleComponent } from "./types";
import {
  parseFunctionBody,
  parseJSXElement,
  parseTypeAnnotation,
} from "./parse";
import { JSXElement } from "@babel/types";

export async function transformFunctionToModuleComponent(
  context: FileContext,
) {
  const moduleComponents: ModuleComponent[] = [];
  const { functionsWithComment } = context;

  for (const functionWithComment of functionsWithComment) {
    const { functionDeclaration, leadingComment } = functionWithComment;

    // 判断是否是jsx组件
    const isJsxComponent = functionDeclaration.body.type === "BlockStatement" &&
      functionDeclaration.body.body.some((statement) =>
        statement.type === "ReturnStatement" &&
        statement.argument?.type === "JSXElement"
      );
    if (!isJsxComponent) {
      continue;
    }

    // 拼出模块组件
    // 获取组件名称 和 组件描述
    // 获取组件的参数 和 组件的接口
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

    const componentBody = await parseFunctionBody(functionDeclaration.body);

    let results: JSXElement[] = [];
    for (const statement of functionDeclaration.body.body) {
      if (
        statement.type === "ReturnStatement" &&
        statement.argument?.type === "JSXElement"
      ) {
        const result = await parseJSXElement(
          statement.argument,
          context,
        );
        results.push(...result);
      }
    }
    console.log(results);

    const component: ModuleComponent = {
      componentName: functionName,
      componentDescription,
      componentBody,
      componentParams,
    };

    moduleComponents.push(component);
  }

  return moduleComponents;
}
