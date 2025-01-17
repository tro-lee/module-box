import type {
  BlockStatement,
  Expression,
  Identifier,
  JSXElement,
  JSXFragment,
  Noop,
  ObjectProperty,
  TSTypeAnnotation,
  TypeAnnotation,
} from "@babel/types";
import generate from "@babel/generator";
import { parse as parseComment } from "comment-parser";
import {
  ComponentJSXElement,
  CustomTypeAnnotation,
  FileContext,
  InterfaceTypeAnnotation,
  Prop,
} from "./types";
import {
  getElementDeclarationInContext,
  getInterfaceDeclarationInContext,
} from "./context";

// 解析类型注解
export async function parseTypeAnnotation(
  typeAnnotation: TSTypeAnnotation | TypeAnnotation | Noop | null | undefined,
  context: FileContext
): Promise<CustomTypeAnnotation> {
  if (typeAnnotation && typeAnnotation.type === "TSTypeAnnotation") {
    const _typeAnnotation = typeAnnotation.typeAnnotation;

    // 引用处理
    if (_typeAnnotation.type === "TSTypeReference") {
      const typeName = _typeAnnotation.typeName;
      if (typeName.type !== "Identifier") {
        return {
          type: "TodoTypeAnnotation",
          typeName: "todo",
          data: _typeAnnotation,
        };
      }

      const declaration = await getInterfaceDeclarationInContext(
        typeName.name,
        context
      );

      if (!declaration) {
        return {
          type: "TodoTypeAnnotation",
          typeName: typeName.name,
        };
      }

      // 若来自nodeModule模块
      if (declaration.type === "NodeModuleImportDeclaration") {
        return {
          type: "NodeModuleImportTypeAnnotation",
          typeName: typeName.name,
          importPath: declaration.filePath,
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
              declaration.context
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
            const extendsInterfaceItem = (await parseTypeAnnotation(
              {
                type: "TSTypeAnnotation",
                typeAnnotation: {
                  type: "TSTypeReference",
                  typeName: extendsItem.expression,
                },
              },
              declaration.context
            )) as InterfaceTypeAnnotation | null;

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
      const parsedProperties = (
        await Promise.all(
          properties.map(async (property): Promise<Prop | undefined> => {
            if (
              property.type === "TSPropertySignature" &&
              property.key.type === "Identifier"
            ) {
              const propKey = property.key.name;
              const propType = await parseTypeAnnotation(
                property.typeAnnotation,
                context
              );

              return {
                propKey,
                propType,
              };
            }
          })
        )
      ).filter((v) => v !== undefined);

      return {
        type: "ObjectTypeAnnotation",
        props: parsedProperties,
      };
    }

    // Union处理
    if (_typeAnnotation.type === "TSUnionType") {
      const unionMembers = _typeAnnotation.types;
      const parsedUnionMembers = await Promise.all(
        unionMembers.map(async (member) => {
          return await parseTypeAnnotation(
            {
              type: "TSTypeAnnotation",
              typeAnnotation: member,
            },
            context
          );
        })
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
          context
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
      return {
        type: "UndefinedTypeAnnotation"
      }
    }
  }

  return {
    type: "TodoTypeAnnotation",
    typeName: typeAnnotation?.type ?? '',
    data: typeAnnotation,
  };
}

// 辅助函数 解析表达式
// 用于获取表达式中的标识符
function findIdentifiersInExpression(
  expression: Expression | null | undefined
): string[] {
  if (!expression) return [];

  switch (expression.type) {
    case "CallExpression":
      if (expression.callee.type === "Identifier") {
        return [
          expression.callee.name,
          ...expression.arguments
            .map((arg) => (arg.type === "Identifier" ? arg.name : ""))
            .filter(Boolean),
        ];
      }
      break;
    case "Identifier":
      return [expression.name];
    case "LogicalExpression":
      return [
        ...findIdentifiersInExpression(expression.left),
        ...findIdentifiersInExpression(expression.right),
      ];
    case "ObjectExpression":
      return (
        expression.properties
          .map((prop) => {
            if (
              prop.type === "ObjectProperty" &&
              prop.key.type === "Identifier"
            ) {
              return prop.key.name;
            }
          })
          .filter((v) => v !== undefined) || []
      );
  }

  return [];
}

// 解析函数体
// 用于获取变量关系
export async function parseFunctionBody(functionBody: BlockStatement) {
  const statementMapWithIdentifiers: Map<
    string,
    {
      leftIdentifiers: string[];
      rightIdentifiers: string[];
    }
  > = new Map();

  for (const statement of functionBody.body) {
    const sourceCode = generate(statement).code;

    if (statement.type === "VariableDeclaration") {
      const leftIdentifiers = statement.declarations
        .map((variableDeclaration) => {
          if (variableDeclaration.id.type === "Identifier") {
            return [variableDeclaration.id.name];
          } else if (variableDeclaration.id.type === "ObjectPattern") {
            return variableDeclaration.id.properties
              .filter(
                (prop) =>
                  prop.type === "ObjectProperty" &&
                  prop.key.type === "Identifier"
              )
              .map((prop) => ((prop as ObjectProperty).key as Identifier).name);
          }
          return [];
        })
        .filter((v) => v !== undefined);

      const rightIdentifiers = statement.declarations
        .map((variableDeclaration) =>
          findIdentifiersInExpression(variableDeclaration.init)
        )
        .filter((v) => v !== undefined);

      statementMapWithIdentifiers.set(sourceCode, {
        leftIdentifiers: leftIdentifiers.flat(),
        rightIdentifiers: rightIdentifiers.flat(),
      });
    } else if (statement.type === "ExpressionStatement") {
      const identifiers = findIdentifiersInExpression(statement.expression);

      statementMapWithIdentifiers.set(sourceCode, {
        leftIdentifiers: identifiers,
        rightIdentifiers: [],
      });
    }
  }

  return statementMapWithIdentifiers;
}

// 解析JSX元素
// 只解析组件函数
export async function parseExpressionToJSXElement(
  expression: Expression,
  currentContext: FileContext
): Promise<Omit<ComponentJSXElement, "moduleComponent">[]> {
  let jsxElements: Omit<ComponentJSXElement, "moduleComponent">[] = [];

  // 解析表达式
  if (expression.type === "LogicalExpression") {
    jsxElements.push(
      ...(await parseExpressionToJSXElement(expression.left, currentContext)),
      ...(await parseExpressionToJSXElement(expression.right, currentContext))
    );
  }

  // 解析表达式
  if (expression.type === "ConditionalExpression") {
    jsxElements.push(
      ...(await parseExpressionToJSXElement(
        expression.consequent,
        currentContext
      )),
      ...(await parseExpressionToJSXElement(
        expression.alternate,
        currentContext
      ))
    );
  }

  // 解析当前jsxElement
  if (expression.type === "JSXElement") {
    const jsxElement = expression as JSXElement;
    if (jsxElement.openingElement.name.type === "JSXIdentifier") {
      const elementDeclaration = await getElementDeclarationInContext(
        jsxElement.openingElement.name.name,
        currentContext
      );

      if (!elementDeclaration) {
        return [];
      }

      const elementAttributes = await Promise.all(
        jsxElement.openingElement.attributes.map(async (attr) => {
          if (
            attr.type === "JSXAttribute" &&
            attr.value &&
            attr.value.type === "JSXExpressionContainer"
          ) {
            return {
              name: attr.name.name,
              value:
                attr.value.expression.type !== "JSXEmptyExpression"
                  ? findIdentifiersInExpression(attr.value.expression)
                  : [],
            };
          }
        })
      );

      jsxElements.push({
        type: "ComponentJSXElement",
        elementName: elementDeclaration.id.name,
        elementParams: elementAttributes,
        importPath: elementDeclaration.filePath,
        elementDeclaration,
      });
    } else {
      throw new Error("JSXElement name is not a Identifier");
    }
  }

  if (expression.type === "JSXElement" || expression.type === "JSXFragment") {
    const jsxElement = expression as JSXElement | JSXFragment;
    // 解析子代标签
    if (jsxElement.children) {
      for (const child of jsxElement.children) {
        if (child.type === "JSXElement") {
          jsxElements.push(
            ...(await parseExpressionToJSXElement(child, currentContext))
          );
        }
      }
    }
  }

  return jsxElements;
}
