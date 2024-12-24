import type { Noop, TSTypeAnnotation, TypeAnnotation } from "@babel/types";
import { parse as parseComment } from "comment-parser";
import {
  CustomTypeAnnotation,
  FileContext,
  GlobalContext,
  InterfaceTypeAnnotation,
  Prop,
} from "./types";
import { getInterfaceDeclarationInContext } from "./context";

export async function parseTypeAnnotation(
  typeAnnotation: TSTypeAnnotation | TypeAnnotation | Noop | null | undefined,
  context: FileContext,
  globalContext: GlobalContext,
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
        globalContext,
      );

      // 若来自nodeModule模块
      if (item?.type === "NodeModuleImportDeclarationItem") {
        return {
          type: "NodeModuleImportTypeAnnotation",
          typeName: typeName.name,
          importPath: item.path,
        };
      }

      // 若是本地文件
      if (item?.type === "InterfaceDeclarationWithComment") {
        const { id, leadingComment, tsTypeElements } = item;
        const comment = parseComment("/*" + leadingComment?.value + "*/");

        let interfaceDescription = "";
        for (const item of comment) {
          item.tags.forEach((tag) => {
            if (tag.name === "description") {
              interfaceDescription = tag.name;
            }
          });
        }

        const interfaceProps: InterfaceTypeAnnotation["interfaceProps"] = [];
        for (const prop of tsTypeElements) {
          if (
            prop.type === "TSPropertySignature" &&
            prop.key.type === "Identifier"
          ) {
            const propKey = prop.key.name;
            const propType = await parseTypeAnnotation(
              prop.typeAnnotation,
              context,
              globalContext,
            );

            interfaceProps.push({
              propKey,
              propType,
            });
          }
        }

        return {
          type: "InterfaceTypeAnnotation",
          filePath: item.path,
          interfaceName: id.name,
          interfaceDescription,
          interfaceProps,
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
              globalContext,
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
            globalContext,
          );
        }),
      );

      return {
        type: "UnionTypeAnnotation",
        members: parsedUnionMembers,
      };
    }

    // null处理
    if (_typeAnnotation.type === "TSNullKeyword") {
      return {
        type: "NullTypeAnnotation",
      };
    }
  }
}
