import type {
  JSXElement,
  Noop,
  TSTypeAnnotation,
  TypeAnnotation,
} from "@babel/types";
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
import { NodePath } from "@babel/core";

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
        type: "UndefinedTypeAnnotation",
      };
    }
  }

  return {
    type: "TodoTypeAnnotation",
    typeName: typeAnnotation?.type ?? "",
    data: typeAnnotation,
  };
}

// 解析函数体
// 用于获取变量关系
// export async function parseFunctionBodyWithNodePath(
//   functionBodyWithNodePath: NodePath<BlockStatement>
// ) {
//   const statementMapWithIdentifiers: Map<
//     string,
//     {
//       leftIdentifiers: string[];
//       rightIdentifiers: string[];
//     }
//   > = new Map();

//   for (const statement of functionBody.body) {
//     const sourceCode = generate(statement).code;

//     if (statement.type === "VariableDeclaration") {
//       const leftIdentifiers = statement.declarations
//         .map((variableDeclaration) => {
//           if (variableDeclaration.id.type === "Identifier") {
//             return [variableDeclaration.id.name];
//           } else if (variableDeclaration.id.type === "ObjectPattern") {
//             return variableDeclaration.id.properties
//               .filter(
//                 (prop) =>
//                   prop.type === "ObjectProperty" &&
//                   prop.key.type === "Identifier"
//               )
//               .map((prop) => ((prop as ObjectProperty).key as Identifier).name);
//           }
//           return [];
//         })
//         .filter((v) => v !== undefined);

//       const rightIdentifiers = statement.declarations
//         .map((variableDeclaration) =>
//           findIdentifiersInExpression(variableDeclaration.init)
//         )
//         .filter((v) => v !== undefined);

//       statementMapWithIdentifiers.set(sourceCode, {
//         leftIdentifiers: leftIdentifiers.flat(),
//         rightIdentifiers: rightIdentifiers.flat(),
//       });
//     } else if (statement.type === "ExpressionStatement") {
//       const identifiers = findIdentifiersInExpression(statement.expression);

//       statementMapWithIdentifiers.set(sourceCode, {
//         leftIdentifiers: identifiers,
//         rightIdentifiers: [],
//       });
//     }
//   }

//   return statementMapWithIdentifiers;
// }

// 解析JSX元素
// 只解析组件函数
export async function parseJSXElementWithNodePath(
  jsxElementWithNodePath: NodePath<JSXElement>,
  currentContext: FileContext
): Promise<ComponentJSXElement | undefined> {
  const jsxElement = jsxElementWithNodePath.node;

  // 当前仅支持<Component />写法
  if (jsxElement.openingElement.name.type === "JSXIdentifier") {
    const elementDeclaration = await getElementDeclarationInContext(
      jsxElement.openingElement.name.name,
      currentContext
    );

    if (!elementDeclaration) {
      console.warn(
        `在解析JSXElement语句时，未找到elementDeclaration ${jsxElement.openingElement.name.name} ${currentContext.path}`
      );
      return undefined;
    }


    // 解析属性，获取{}中的内容
    const elementAttributes = await Promise.all(
      jsxElement.openingElement.attributes.map(async (attr) => {
        if (
          attr.type === "JSXAttribute" &&
          attr.value &&
          attr.value.type === "JSXExpressionContainer"
        ) {
          // return {
          //   name: attr.name.name,
          //   value:
          //     attr.value.expression.type !== "JSXEmptyExpression"
          //       ? findIdentifiersInExpression(attr.value.expression)
          //       : [],
          // };
        }
      })
    );

    return {
      type: "ComponentJSXElement",
      elementName: elementDeclaration.id.name,
      elementParams: elementAttributes,
      importPath: elementDeclaration.filePath,
      elementDeclaration,
      moduleComponent: undefined,
    };
  }

  // 当前不支持<Component.Child />写法
  if (jsxElement.openingElement.name.type === "JSXMemberExpression") {
  }
}
