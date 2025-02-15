import { transformComponentToDeclaration } from "./transform";
import { Component, Module } from "./types";
import generate from "@babel/generator";

// 文档生成相关的常量
const DOC_CONSTANTS = {
  MARKDOWN_TYPE: "text/markdown",
  HEADERS: {
    MAIN: "# {name} Component Info\n\n",
    DEPENDENCIES: "# Dependency Components\n\n",
  },
  COMPONENT_INFO: {
    NAME: "- Component: {name}\n",
    FILE_PATH: "\t- File Path: {filePath}\n",
    PACKAGE: "\t- Package: {package}\n",
    TYPE: "\t- Component Type: {type}\n",
    DESCRIPTION: "\t- Component Description: {description}\n",
    CODE: "\t- Core Code (Minified):\n\t```tsx\n\t{code}\n\t```\n",
  },
} as const;

/**
 * 生成组件的文档内容
 * @param component 组件信息
 * @returns 文档内容数组
 */
async function generateComponentDoc(component: Component): Promise<string[]> {
  const chunks: string[] = [];
  chunks.push(
    DOC_CONSTANTS.COMPONENT_INFO.NAME.replace("{name}", component.componentName)
  );

  const isLocalComponent = component.type === "LocalComponent";
  chunks.push(
    DOC_CONSTANTS.COMPONENT_INFO.TYPE.replace(
      "{type}",
      isLocalComponent ? "local component" : "reference node_modules component"
    )
  );

  if (isLocalComponent) {
    chunks.push(
      DOC_CONSTANTS.COMPONENT_INFO.FILE_PATH.replace(
        "{filePath}",
        component.componentFilePath
      )
    );
    if (component.componentDescription) {
      chunks.push(
        DOC_CONSTANTS.COMPONENT_INFO.DESCRIPTION.replace(
          "{description}",
          component.componentDescription
        )
      );
    }

    const declaration = await transformComponentToDeclaration(component);
    if (declaration?.type === "FunctionDeclarationWithBaseInfo") {
      const { id, params, body } = declaration.functionDeclaration;
      const code = generate(
        {
          type: "FunctionDeclaration",
          id,
          params,
          body,
          generator: false,
          async: false,
        },
        { compact: true, minified: true }
      ).code.replace(/\n/g, "\n\t");

      chunks.push(DOC_CONSTANTS.COMPONENT_INFO.CODE.replace("{code}", code));
    } else {
      throw new Error(`无法生成组件 ${component.componentName} 的声明信息`);
    }
  } else {
    chunks.push(
      DOC_CONSTANTS.COMPONENT_INFO.PACKAGE.replace(
        "{package}",
        component.packageName
      )
    );
  }

  chunks.push("\n");
  return chunks;
}

// 收集组件的所有依赖组件
async function collectReferencedComponents(
  component: Component,
  componentContext: Map<string, Component>
): Promise<Component[]> {
  const processedComponents = new Set<Component>();
  const queue: Component[] = [component];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.type === "LocalComponent") {
      for (const { componentKey } of current.componentJSXElements) {
        if (!visited.has(componentKey)) {
          visited.add(componentKey);
          const depComponent = componentContext.get(componentKey);
          if (depComponent) {
            processedComponents.add(depComponent);
            queue.push(depComponent);
          }
        }
      }
    }
  }

  return Array.from(processedComponents);
}

// 生成模块的完整文档
export async function generateModuleDoc(
  module: Module,
  componentContext: Map<string, Component>
): Promise<Blob> {
  const chunks: string[] = [
    DOC_CONSTANTS.HEADERS.MAIN.replace("{name}", module.componentName),
  ];

  if (module.type === "LocalModule") {
    const component = componentContext.get(module.componentKey);
    if (component) {
      chunks.push(...(await generateComponentDoc(component)), "\n\n");

      const referencedComponents = await collectReferencedComponents(
        component,
        componentContext
      );

      if (referencedComponents.length > 0) {
        chunks.push(
          DOC_CONSTANTS.HEADERS.DEPENDENCIES,
          ...(
            await Promise.all(referencedComponents.map(generateComponentDoc))
          ).flat()
        );
      }
    }
  }

  return new Blob(chunks, { type: DOC_CONSTANTS.MARKDOWN_TYPE });
}
