import fs from "fs";
import path from "path";
import { parse as parseComment } from "comment-parser";
import { findParamInImportDeclaration } from "./src/esmFunction";
import { ASTAnalyzer } from "./src/ast";
import { ModulesAnalyzer } from "./src/modulesAnalyzer";

async function analyzeFile(filePath: string) {
  try {
    const analyzer = await ASTAnalyzer.scan(filePath);
    const { functionDeclarations } = analyzer.context;

    // 处理找到的函数注释
    for (const func of functionDeclarations) {
      if (!func.leadingComment?.value) continue;

      const comments = parseComment("/*" + func.leadingComment.value + "*/");
      console.log(
        `[${filePath}] Found documented function:`,
        func.functionDeclaration.id?.name,
      );

      if (!comments[0]?.tags) continue;

      // 处理函数注释中的参数
      const results = await Promise.all(
        comments[0].tags.map(async (tag) => {
          if (tag.tag !== "param") return;

          const paramType = tag.type;
          return analyzer.context.interfaceDeclarations
            .find(
              (item) => item.name === paramType,
            ) ??
            await findParamInImportDeclaration(
              analyzer.context.importDeclarations,
              paramType,
              filePath,
            );
        }),
      );
      const interfaceDeclarations = results.find(Boolean);

      console.log(interfaceDeclarations);
    }

    return analyzer;
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
  }
}

export default async function (filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error("Error: File does not exist:", filePath);
    process.exit(1);
  }

  if (fs.statSync(filePath).isDirectory()) {
    console.error("Error: The provided path is a directory, not a file.");
    process.exit(1);
  }

  const analyzer = await ASTAnalyzer.scan(path.resolve(filePath));
  const { functionDeclarations } = analyzer.context;

  for (const func of functionDeclarations) {
    const modulesAnalyzer = await ModulesAnalyzer.new(func, analyzer.context);
  }

  await analyzeFile(path.resolve(filePath));

  console.log(analyzer.context);
}
