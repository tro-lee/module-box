import { parse as parseComment } from "comment-parser";
import { FileContext, GlobalContext, ModuleComponent } from "./core";

export function transformFunctionToModuleComponent(
  context: FileContext,
  globalContext: GlobalContext,
) {
  const moduleComponents: ModuleComponent[] = [];
  const { functionsWithComment } = context;

  for (const functionWithComment of functionsWithComment) {
    const { functionDeclaration, leadingComment } = functionWithComment;

    const functionName = functionDeclaration.id.name;
    const comment = parseComment("/*" + leadingComment?.value + "*/");

    // 拼出模块组件
    let componentDescription = "";
    for (const item of comment) {
      item.tags.forEach((tag) => {
        if (tag.name === "description") {
          componentDescription = tag.name;
        }
      });
    }

    const component: ModuleComponent = {
      name: functionName,
      description: componentDescription,
      params: [],
    };

    moduleComponents.push(component);
  }

  return moduleComponents;
}
