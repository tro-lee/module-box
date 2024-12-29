import { parse as parseComment } from "comment-parser";
import {
  ComponentJSXElement,
  FileContext,
  FunctionDeclarationWithComment,
  ModuleComponent,
  NodeModuleImportDeclaration,
} from "./types";
import { parseJSXElement, parseTypeAnnotation } from "./parse";

export async function transformFunctionToModuleComponentByDeclaration(
  functionWithComment:
    | FunctionDeclarationWithComment
    | NodeModuleImportDeclaration,
): Promise<ModuleComponent | undefined> {
  if (functionWithComment.type === "NodeModuleImportDeclaration") {
    return {
      type: "NodeModuleComponent",
      componentName: functionWithComment.id.name,
      packageName: functionWithComment.filePath,
    };
  }

  const { functionDeclaration, leadingComment, context } = functionWithComment;

  // 判断是否是jsx组件
  const isJsxComponent = isJSXFunctionComponent(functionWithComment);
  if (!isJsxComponent) {
    console.error(
      `[${context.path} ${functionDeclaration.id.name}] 不是jsx组件`,
    );
    return;
  }

  // ============================
  // 拼出模块组件
  // ============================

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

  let componentJSXElements: ComponentJSXElement[] = [];
  for (const statement of functionDeclaration.body.body) {
    if (
      statement.type === "ReturnStatement" &&
      statement.argument?.type === "JSXElement"
    ) {
      const result = await parseJSXElement(
        statement.argument,
        context,
      );

      for (const item of result) {
        const _item = item as ComponentJSXElement;
        _item.moduleComponent =
          await transformFunctionToModuleComponentByDeclaration(
            _item.functionDeclaration,
          ) as ModuleComponent;
        if (!_item.moduleComponent) {
          console.error(
            `[${context.path} ${functionDeclaration.id.name}] 无法解析子组件: ${_item.functionDeclaration.id.name}`,
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
}

function isJSXFunctionComponent(
  functionDeclaration: FunctionDeclarationWithComment,
) {
  return functionDeclaration.functionDeclaration.body.type ===
      "BlockStatement" &&
    functionDeclaration.functionDeclaration.body.body.some((statement) =>
      statement.type === "ReturnStatement" &&
      (statement.argument?.type === "JSXElement" ||
        statement.argument?.type === "JSXFragment")
    );
}

export async function transformFunctionToModuleComponent(
  context: FileContext,
) {
  const { functionsWithComment } = context;
  const moduleComponents: ModuleComponent[] = [];

  for (const functionWithComment of functionsWithComment) {
    try {
      if (isJSXFunctionComponent(functionWithComment)) {
        const component = await transformFunctionToModuleComponentByDeclaration(
          functionWithComment,
        );
        moduleComponents.push(component);
      }
    } catch (error) {
      console.error(error);
    }
  }

  console.log(moduleComponents);
  return moduleComponents;
}
