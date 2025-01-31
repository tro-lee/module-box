import type {
  JSXElement,
  Noop,
  TSTypeAnnotation,
  TypeAnnotation,
  BlockStatement,
  Node,
  MemberExpression,
  VariableDeclarator,
} from "@babel/types";
import { parse as parseComment } from "comment-parser";
import {
  ComponentJSXElement,
  CustomTypeAnnotation,
  FileContext,
  InterfaceTypeAnnotation,
  Prop,
  Declaration,
} from "./types";
import { getDeclarationInContext } from "./context";
import { NodePath } from "@babel/core";
import generate from "@babel/generator";

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

      const declaration = await getDeclarationInContext(typeName.name, context);

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

type CustomBinding = {
  name: string;
  usedProperties: string[];
  referenceStatements: string[];
  referencePaths: NodePath<Node>[];
  initHook: Declaration | null;
};

// 解析函数体
// TODO: 当前还没有做 更里的作用域
export async function parseBlockStatementWithNodePath(
  blockStatementWithNodePath: NodePath<BlockStatement>,
  context: FileContext
) {
  const totalBindings: CustomBinding[] = [];

  for (const [key, binding] of Object.entries(
    blockStatementWithNodePath.scope.bindings
  )) {
    // 获取初始化函数
    let initHook: Declaration | null = null;
    let hookName = "";
    binding.path.traverse({
      Identifier(path) {
        if (path.key === "callee") {
          hookName = path.node.name;
        }
      },
    });
    if (hookName) {
      initHook = await getDeclarationInContext(hookName, context);
    }

    // 获取所有引用语句
    let referencePaths = [binding.path, ...binding.referencePaths]
      .map((referencePath) => {
        let refCurrentPath: NodePath<Node> | null = referencePath;
        while (
          refCurrentPath &&
          refCurrentPath.type !== "ExpressionStatement" &&
          refCurrentPath.type !== "VariableDeclaration" &&
          refCurrentPath.type !== "JSXElement"
        ) {
          refCurrentPath = refCurrentPath.parentPath;
        }
        return refCurrentPath;
      })
      .filter((v) => v !== null);
    let referenceStatements = referencePaths.map((path) => {
      return generate(path.node).code;
    });
    referencePaths = Array.from(new Set(referencePaths));
    referenceStatements = Array.from(new Set(referenceStatements));

    // 获取Binding被用到所有属性
    let usedProperties = referencePaths
      .map((reference) => {
        // 比如 a.b
        if (reference.parentPath?.type === "MemberExpression") {
          const memberExpression = reference.parentPath
            .node as MemberExpression;
          if (memberExpression.property.type === "Identifier") {
            return memberExpression.property.name;
          }
        }

        // 比如 const {a, ...c} = b
        if (reference.parentPath?.type === "VariableDeclarator") {
          const variableDeclarator = reference.parentPath
            .node as VariableDeclarator;
          if (variableDeclarator.id.type === "ObjectPattern") {
            return variableDeclarator.id.properties.map((property) => {
              if (
                property.type === "ObjectProperty" &&
                property.key.type === "Identifier"
              ) {
                return property.key.name;
              } else if (
                property.type === "RestElement" &&
                property.argument.type === "Identifier"
              ) {
                return property.argument.name;
              }
              return "";
            });
          }
        }

        return "";
      })
      .flat()
      .filter((v) => v !== "");
    usedProperties = Array.from(new Set(usedProperties));

    totalBindings.push({
      name: key,
      referencePaths,
      referenceStatements,
      usedProperties,
      initHook,
    });
  }

  console.log(totalBindings);
}

// 解析JSX元素
// 只解析组件函数
export async function parseJSXElementWithNodePath(
  jsxElementWithNodePath: NodePath<JSXElement>,
  currentContext: FileContext
): Promise<ComponentJSXElement | undefined> {
  let elementName: string | undefined = undefined;
  let elementAttributes: ComponentJSXElement["elementAttributes"] = [];

  jsxElementWithNodePath.traverse({
    JSXIdentifier(path) {
      if (path.parentPath.type === "JSXOpeningElement" && path.key === "name") {
        elementName = path.node.name;
      }
    },
    // 当前仅能解析<AAA attr="123" />
    JSXAttribute(path) {
      if (
        path.parentPath.type === "JSXOpeningElement" &&
        path.listKey === "attributes"
      ) {
        const attrName =
          path.node.name.type === "JSXIdentifier"
            ? path.node.name.name
            : path.node.name.namespace.name + ":" + path.node.name.name;
        const attrValue = path.node.value;
        elementAttributes.push({
          attrName,
          attrValue,
        });
      }
    },
  });

  if (!elementName) {
    console.warn(
      `在解析JSXElement语句时，未找到elementName ${jsxElementWithNodePath.node.openingElement.name} ${currentContext.path}`
    );
    return undefined;
  }

  const elementDeclaration = await getDeclarationInContext(
    elementName,
    currentContext
  );

  if (!elementDeclaration) {
    console.warn(
      `在解析JSXElement语句时，未找到elementDeclaration ${elementName} ${currentContext.path}`
    );
    return undefined;
  }

  return {
    type: "ComponentJSXElement",
    elementName,
    elementAttributes,
    importPath: currentContext.path,
    elementDeclaration,
  };
}
