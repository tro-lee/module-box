import type {
  BlockStatement,
  Expression,
  JSXElement,
  JSXEmptyExpression,
  Noop,
  TSTypeAnnotation,
  TypeAnnotation,
  VariableDeclarator,
} from "@babel/types";
import { parse as parseComment } from "comment-parser";
import {
  CustomTypeAnnotation,
  FileContext,
  InterfaceTypeAnnotation,
  Prop,
  Source,
  Variable,
} from "./types";
import {
  getFunctionDeclarationInContext,
  getInterfaceDeclarationInContext,
} from "./context";

// 解析类型注解
export async function parseTypeAnnotation(
  typeAnnotation: TSTypeAnnotation | TypeAnnotation | Noop | null | undefined,
  context: FileContext,
): Promise<CustomTypeAnnotation> {
  if (!typeAnnotation) return;

  if (typeAnnotation.type === "TSTypeAnnotation") {
    const _typeAnnotation = typeAnnotation.typeAnnotation;

    // 引用处理
    if (_typeAnnotation.type === "TSTypeReference") {
      const typeName = _typeAnnotation.typeName;
      if (typeName.type !== "Identifier") return;

      const item = await getInterfaceDeclarationInContext(
        typeName.name,
        context,
      );
      if (!item) return;

      const { declaration, context: declarationInContext } = item;

      // 若来自nodeModule模块
      if (declaration.type === "NodeModuleImportDeclarationItem") {
        return {
          type: "NodeModuleImportTypeAnnotation",
          typeName: typeName.name,
          importPath: declaration.path,
        };
      }

      // 若是本地文件
      if (declaration.type === "InterfaceDeclarationWithComment") {
        const { id, leadingComment, tsTypeElements, extendsExpression } =
          declaration;
        const comment = parseComment("/*" + leadingComment?.value + "*/");

        let interfaceDescription = "";
        for (const item of comment) {
          item.tags.forEach((tag) => {
            if (tag.name === "description") {
              interfaceDescription = tag.name;
            }
          });
        }

        // 解析接口属性
        const interfaceProps: InterfaceTypeAnnotation["interfaceProps"] = [];
        for (const prop of tsTypeElements) {
          if (
            prop.type === "TSPropertySignature" &&
            prop.key.type === "Identifier"
          ) {
            const propKey = prop.key.name;
            const propType = await parseTypeAnnotation(
              prop.typeAnnotation,
              declarationInContext,
            );

            interfaceProps.push({
              propKey,
              propType,
            });
          }
        }

        // 解析接口继承
        const extendsInterface: InterfaceTypeAnnotation[] = [];
        for (const extendsItem of extendsExpression) {
          if (extendsItem.expression.type === "Identifier") {
            const extendsInterfaceItem = await parseTypeAnnotation(
              {
                type: "TSTypeAnnotation",
                typeAnnotation: {
                  type: "TSTypeReference",
                  typeName: extendsItem.expression,
                },
              },
              declarationInContext,
            ) as InterfaceTypeAnnotation | undefined;

            if (extendsInterfaceItem) {
              extendsInterface.push(extendsInterfaceItem);
            }
          }
        }

        return {
          type: "InterfaceTypeAnnotation",
          filePath: declaration.filePath,
          interfaceName: id.name,
          interfaceDescription,
          interfaceProps,
          interfaceExtends: extendsInterface,
        };
      }
    }

    // 字面量处理
    if (_typeAnnotation.type === "TSTypeLiteral") {
      const properties = _typeAnnotation.members;
      if (!properties) return;

      const parsedProperties = (await Promise.all(
        properties.map(async (property): Promise<Prop | undefined> => {
          if (
            property.type === "TSPropertySignature" &&
            property.key.type === "Identifier"
          ) {
            const propKey = property.key.name;
            const propType = await parseTypeAnnotation(
              property.typeAnnotation,
              context,
            );

            return {
              propKey,
              propType,
            };
          }
        }),
      )).filter((v) => v !== undefined);

      return {
        type: "ObjectTypeAnnotation",
        props: parsedProperties,
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
          );
        }),
      );

      return {
        type: "UnionTypeAnnotation",
        members: parsedUnionMembers,
      };
    }

    // 数组处理
    if (_typeAnnotation.type === "TSArrayType") {
      return {
        type: "ArrayTypeAnnotation",
        elementType: await parseTypeAnnotation(
          {
            type: "TSTypeAnnotation",
            typeAnnotation: _typeAnnotation.elementType,
          },
          context,
        ),
      };
    }

    // 以下是基础的类型处理

    // null处理
    if (_typeAnnotation.type === "TSNullKeyword") {
      return {
        type: "NullTypeAnnotation",
      };
    }

    // string处理
    if (_typeAnnotation.type === "TSStringKeyword") {
      return {
        type: "StringKeywordTypeAnnotation",
      };
    }

    // number处理
    if (_typeAnnotation.type === "TSNumberKeyword") {
      return {
        type: "NumberKeywordTypeAnnotation",
      };
    }

    // boolean处理
    if (_typeAnnotation.type === "TSBooleanKeyword") {
      return {
        type: "BooleanKeywordTypeAnnotation",
      };
    }

    // any处理
    if (_typeAnnotation.type === "TSAnyKeyword") {
      return {
        type: "AnyTypeAnnotation",
      };
    }

    if (_typeAnnotation.type === "TSUndefinedKeyword") {
    }

    return {
      type: "TodoTypeAnnotation",
      typeAnnotation: _typeAnnotation,
    };
  }
}

// 辅助函数 用于解析函数体
function parseVariableDeclaratorInit(
  init: VariableDeclarator["init"],
): Source | undefined {
  // 赋值给标识符
  if (
    init?.type === "CallExpression"
  ) {
    if (init.callee.type === "Identifier") {
      return {
        type: "CallExpression",
        calleeName: init.callee.name,
        arguments: init.arguments.map((arg) =>
          arg.type === "Identifier" ? arg.name : ""
        ).filter(Boolean),
      };
    } else if (init.callee.type === "ArrowFunctionExpression") {
    }
  } else if (init?.type === "Identifier") {
    return {
      type: "Identifier",
      name: init.name,
    };
  }
}

// 解析函数体
// 用于获取变量关系
export async function parseFunctionBody(functionBody: BlockStatement) {
  const variables: Variable[] = [];

  functionBody.body.forEach((statement) => {
    if (statement.type !== "VariableDeclaration") return;

    statement.declarations.forEach((variableDeclaration) => {
      if (variableDeclaration.id.type === "Identifier") {
        // 赋值给标识符
        const result = parseVariableDeclaratorInit(variableDeclaration.init);
        if (result) {
          variables.push({
            name: variableDeclaration.id.name,
            source: result,
          });
        }
      } else if (variableDeclaration.id.type === "ObjectPattern") {
        // 解构赋值
        variableDeclaration.id.properties.forEach((prop) => {
          if (
            prop.type === "ObjectProperty" && prop.key.type === "Identifier"
          ) {
            const result = parseVariableDeclaratorInit(
              variableDeclaration.init,
            );
            if (result) {
              variables.push({
                name: prop.key.name,
                source: result,
              });
            }
          }
        });
      }
    });
  });

  return variables;
}

type TopicObject = {
  type: "TopicObject";
  objectName: string;
  sourceCode: string;
};

async function parseExpression(
  expression: Expression | JSXEmptyExpression,
  currentContext: FileContext,
) {
  return {};
}

// 解析JSX元素
export async function parseJSXElement(
  jsxElement: JSXElement,
  currentContext: FileContext,
) {
  let jsxElements: any[] = [];

  // 解析当前jsxElement
  if (jsxElement.openingElement.name.type === "JSXIdentifier") {
    // 获取函数声明
    const functionDeclaration = await getFunctionDeclarationInContext(
      jsxElement.openingElement.name.name,
      currentContext,
    );
    if (!functionDeclaration) return [];

    // 解析属性
    const elementAttributes = await Promise.all(
      jsxElement.openingElement.attributes.map(
        async (attr) => {
          if (
            attr.type === "JSXAttribute" &&
            attr.value &&
            attr.value.type === "JSXExpressionContainer"
          ) {
            return {
              name: attr.name.name,
              value: await parseExpression(
                attr.value.expression,
                currentContext,
              ),
            };
          }
        },
      ),
    );

    jsxElements.push(
      {
        type: "ComponentElement",
        componentName: functionDeclaration.declaration.id.name,
        componentParams: elementAttributes,
        importPath: functionDeclaration.context.path,
      },
    );
  }

  // 解析子代
  if (jsxElement.children) {
    for (const child of jsxElement.children) {
      if (child.type === "JSXElement") {
        jsxElements.push(
          ...(await parseJSXElement(
            child,
            currentContext,
          )),
        );
      }
    }
  }

  return jsxElements;
}
