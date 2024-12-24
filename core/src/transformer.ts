import { parse as parseComment } from "comment-parser";
import { FileContext, GlobalContext, ModuleComponent } from "./types";
import { parseTypeAnnotation } from "./parseType";

export async function transformFunctionToModuleComponent(
  context: FileContext,
  globalContext: GlobalContext,
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
    const functionName = functionDeclaration.id.name;
    const comment = parseComment("/*" + leadingComment?.value + "*/");

    const componentParams = await Promise.all(
      functionDeclaration.params.map(async (param) => {
        // 解析解构类型声明 类似 {a}: {b} 的参数
        if (param.type === "ObjectPattern" && param.typeAnnotation) {
          return await parseTypeAnnotation(
            param.typeAnnotation,
            context,
            globalContext,
          );
        }
      }),
    );

    let componentDescription = "";
    for (const item of comment) {
      item.tags.forEach((tag) => {
        if (tag.name === "description") {
          componentDescription = tag.name;
        }
      });
    }

    const component: ModuleComponent = {
      componentName: functionName,
      componentDescription,
      componentParams,
    };

    moduleComponents.push(component);
  }

  return moduleComponents;
}
