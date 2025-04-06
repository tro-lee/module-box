import type {
  Noop,
  TSTypeAnnotation,
  TypeAnnotation,
} from '@babel/types'
import type { CustomTypeAnnotation, FileContext, InterfaceTypeAnnotation, Prop } from '../types'
import { parse as parseComment } from 'comment-parser'

import { scanDeclarationInContext } from '../scan/context'

// 解析类型注解
export async function parseCustomTypeAnnotation(
  typeAnnotation: TSTypeAnnotation | TypeAnnotation | Noop | null | undefined,
  context: FileContext,
): Promise<CustomTypeAnnotation> {
  if (typeAnnotation && typeAnnotation.type === 'TSTypeAnnotation') {
    const _typeAnnotation = typeAnnotation.typeAnnotation

    // 引用处理
    if (_typeAnnotation.type === 'TSTypeReference') {
      const typeName = _typeAnnotation.typeName
      if (typeName.type !== 'Identifier') {
        return {
          type: 'TodoTypeAnnotation',
          typeName: 'todo',
          data: _typeAnnotation,
        }
      }

      const declaration = await scanDeclarationInContext(typeName.name, context)

      if (!declaration) {
        return {
          type: 'TodoTypeAnnotation',
          typeName: typeName.name,
        }
      }

      // 若来自nodeModule模块
      if (declaration.type === 'NodeModuleImportDeclaration') {
        return {
          type: 'NodeModuleImportTypeAnnotation',
          typeName: typeName.name,
          importPath: declaration.filePath,
        }
      }

      // 若是本地文件
      if (declaration.type === 'InterfaceDeclarationWithBaseInfo') {
        const { id, leadingComment, tsTypeElements, extendsExpression }
          = declaration
        const comment = parseComment(`/*${leadingComment?.value}*/`)

        let interfaceDescription = ''
        for (const item of comment) {
          item.tags.forEach((tag) => {
            if (tag.name === 'description') {
              interfaceDescription = tag.name
            }
          })
        }

        // 解析接口属性
        const interfaceProps: InterfaceTypeAnnotation['interfaceProps'] = []
        for (const prop of tsTypeElements) {
          if (
            prop.type === 'TSPropertySignature'
            && prop.key.type === 'Identifier'
          ) {
            const propKey = prop.key.name
            const propType = await parseCustomTypeAnnotation(
              prop.typeAnnotation,
              declaration.context,
            )

            interfaceProps.push({
              propKey,
              propType,
            })
          }
        }

        // 解析接口继承
        const extendsInterface: InterfaceTypeAnnotation[] = []
        for (const extendsItem of extendsExpression) {
          if (extendsItem.expression.type === 'Identifier') {
            const extendsInterfaceItem = (await parseCustomTypeAnnotation(
              {
                type: 'TSTypeAnnotation',
                typeAnnotation: {
                  type: 'TSTypeReference',
                  typeName: extendsItem.expression,
                },
              },
              declaration.context,
            )) as InterfaceTypeAnnotation | null

            if (extendsInterfaceItem) {
              extendsInterface.push(extendsInterfaceItem)
            }
          }
        }

        return {
          type: 'InterfaceTypeAnnotation',
          filePath: declaration.filePath,
          interfaceName: id.name,
          interfaceDescription,
          interfaceProps,
          interfaceExtends: extendsInterface,
        }
      }
    }

    // 字面量处理
    if (_typeAnnotation.type === 'TSTypeLiteral') {
      const properties = _typeAnnotation.members
      const parsedProperties = (
        await Promise.all(
          properties.map(async (property): Promise<Prop | undefined> => {
            if (
              property.type === 'TSPropertySignature'
              && property.key.type === 'Identifier'
            ) {
              const propKey = property.key.name
              const propType = await parseCustomTypeAnnotation(
                property.typeAnnotation,
                context,
              )

              return {
                propKey,
                propType,
              }
            }
          }),
        )
      ).filter(v => v !== undefined)

      return {
        type: 'ObjectTypeAnnotation',
        props: parsedProperties,
      }
    }

    // Union处理
    if (_typeAnnotation.type === 'TSUnionType') {
      const unionMembers = _typeAnnotation.types
      const parsedUnionMembers = await Promise.all(
        unionMembers.map(async (member) => {
          return await parseCustomTypeAnnotation(
            {
              type: 'TSTypeAnnotation',
              typeAnnotation: member,
            },
            context,
          )
        }),
      )

      return {
        type: 'UnionTypeAnnotation',
        members: parsedUnionMembers,
      }
    }

    // 数组处理
    if (_typeAnnotation.type === 'TSArrayType') {
      return {
        type: 'ArrayTypeAnnotation',
        elementType: await parseCustomTypeAnnotation(
          {
            type: 'TSTypeAnnotation',
            typeAnnotation: _typeAnnotation.elementType,
          },
          context,
        ),
      }
    }

    // 以下是基础的类型处理

    // null处理
    if (_typeAnnotation.type === 'TSNullKeyword') {
      return {
        type: 'NullTypeAnnotation',
      }
    }

    // string处理
    if (_typeAnnotation.type === 'TSStringKeyword') {
      return {
        type: 'StringKeywordTypeAnnotation',
      }
    }

    // number处理
    if (_typeAnnotation.type === 'TSNumberKeyword') {
      return {
        type: 'NumberKeywordTypeAnnotation',
      }
    }

    // boolean处理
    if (_typeAnnotation.type === 'TSBooleanKeyword') {
      return {
        type: 'BooleanKeywordTypeAnnotation',
      }
    }

    // any处理
    if (_typeAnnotation.type === 'TSAnyKeyword') {
      return {
        type: 'AnyTypeAnnotation',
      }
    }

    if (_typeAnnotation.type === 'TSUndefinedKeyword') {
      return {
        type: 'UndefinedTypeAnnotation',
      }
    }
  }

  return {
    type: 'TodoTypeAnnotation',
    typeName: typeAnnotation?.type ?? '',
    data: typeAnnotation,
  }
}
