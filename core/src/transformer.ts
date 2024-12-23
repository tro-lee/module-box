import type { Noop, TSTypeAnnotation, TypeAnnotation } from "@babel/types";
import { parse as parseComment } from "comment-parser";
import {
  FileContext,
  GlobalContext,
  InterfaceDeclarationWithComment,
  ModuleComponent,
  Param,
  Prop,
} from "./types";
import { getInterfaceDeclarationInContext } from "./context";

async function parseInterfaceDeclaration(
  interfaceDeclaration: InterfaceDeclarationWithComment,
  context: FileContext,
  globalContext: GlobalContext,
): Promise<Param> {
  const { id, leadingComment, tsTypeElements } = interfaceDeclaration;
  const comment = parseComment("/*" + leadingComment?.value + "*/");

  let paramDescription = "";
  for (const item of comment) {
    item.tags.forEach((tag) => {
      if (tag.name === "description") {
        paramDescription = tag.name;
      }
    });
  }

  const paramProps: Prop[] = [];
  for (const prop of tsTypeElements) {
    if (prop.type === "TSPropertySignature" && prop.key.type === "Identifier") {
      const propKey = prop.key.name;
      const propType = await parseTypeAnnotation(
        prop.typeAnnotation,
        context,
        globalContext,
      );

      paramProps.push({
        propKey,
        propType,
      });
    }
  }

  return {
    paramName: id.name,
    paramDescription,
    paramProps,
  };
}

async function parseTypeAnnotation(
  typeAnnotation: TSTypeAnnotation | TypeAnnotation | Noop | null | undefined,
  context: FileContext,
  globalContext: GlobalContext,
): Promise<any> {
  if (!typeAnnotation) return;

  if (typeAnnotation.type === "TSTypeAnnotation") {
    const _typeAnnotation = typeAnnotation.typeAnnotation;
    // 引用处理
    // 托管给parseInterfaceDeclartion处理
    if (_typeAnnotation.type === "TSTypeReference") {
      const typeName = _typeAnnotation.typeName;
      if (typeName.type !== "Identifier") return;

      const item = await getInterfaceDeclarationInContext(
        typeName.name,
        context,
        globalContext,
      );

      if (item?.type === "NodeModuleItem") {
        return {
          type: "NodeModuleItem",
          id: typeName,
          path: item.path,
        };
      }

      if (item?.type === "InterfaceDeclarationWithComment") {
        return parseInterfaceDeclaration(item, context, globalContext);
      }

      return;
    }

    // 字面量处理
    if (_typeAnnotation.type === "TSTypeLiteral") {
      const properties = _typeAnnotation.members;
      if (!properties) return;

      const parsedProperties = await Promise.all(
        properties.map(async (property) => {
          if (
            property.type === "TSPropertySignature" &&
            property.key.type === "Identifier"
          ) {
            const propertyName = property.key.name;
            const propertyType = await parseTypeAnnotation(
              property.typeAnnotation,
              context,
              globalContext,
            );

            return {
              propertyName,
              propertyType,
            };
          }
        }),
      );

      return {
        type: "object",
        properties: parsedProperties,
      };
    }

    // Union处理
    if (_typeAnnotation.type === "TSUnionType") {
      const unionMembers = _typeAnnotation.types;
      if (!unionMembers) return;

      const parsedUnionMembers = await Promise.all(
        unionMembers.map(async (member) => {
          return await parseTypeAnnotation(
            {
              type: "TSTypeAnnotation",
              typeAnnotation: member,
            },
            context,
            globalContext,
          );
        }),
      );

      return {
        type: "union",
        members: parsedUnionMembers,
      };
    }
  }
}

export async function transformFunctionToModuleComponent(
  context: FileContext,
  globalContext: GlobalContext,
) {
  if (context.type === "NodeModuleFileContext") {
    return [];
  }

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
      componentParams: componentParams.filter(
        (item) => item !== undefined,
      ),
    };

    moduleComponents.push(component);
  }

  return moduleComponents;
}
