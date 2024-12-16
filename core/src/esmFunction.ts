import path from "path";
import fs from "fs";
import { ImportDeclaration } from "@babel/types";
import { ASTAnalyzer } from "./astAnalyzer";

// 辅助函数：获取导入的别名
function getImportedAlias(specifier: any): string {
  if (specifier.type === "ImportSpecifier") {
    return specifier.local.name ?? specifier.imported.name;
  } else if (specifier.type === "ImportDefaultSpecifier") {
    return specifier.local.name;
  }
  return "";
}

// 辅助函数：获取导入的名称
function getImportedName(specifier: any): string {
  if (specifier.type === "ImportSpecifier") {
    return specifier.imported.name ?? specifier.local.name;
  } else if (specifier.type === "ImportDefaultSpecifier") {
    return specifier.local.name;
  }
  return "";
}

// 辅助函数：从引用中查找对应的接口
export async function findParamInImportDeclaration(
  importDeclarations: ImportDeclaration[],
  paramType: string,
  currentFilePath: string,
) {
  for (const importAst of importDeclarations) {
    for (const specifier of importAst.specifiers) {
      const importedAlias = getImportedAlias(specifier);
      const importedName = getImportedName(specifier);
      if (importedAlias !== paramType) continue;

      // TODO importAST 可能会出现@/ 这种路径 还需要进一步处理
      // 现在只能用于相对和绝对路径
      const importPath = path.resolve(
        path.dirname(currentFilePath),
        importAst.source.value,
      );

      // 按需分析导入的文件
      const extensions = ["", ".ts", ".tsx", ".js", ".jsx"];
      for (const ext of extensions) {
        const realImportPath = importPath + ext;
        if (
          !fs.existsSync(realImportPath) ||
          !fs.statSync(realImportPath).isFile()
        ) {
          continue;
        }

        const analyzer = await ASTAnalyzer.new(realImportPath);
        const { interfaceDeclarations, functionDeclarations } =
          analyzer.context;

        const found = interfaceDeclarations.find(
          (item) => item.name === importedName,
        ) ?? functionDeclarations.find(
          (item) => item.name === importedName,
        );

        return found;
      }
    }
  }
}
