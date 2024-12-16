import fs from "fs";
import path from "path";
import { parseArgs } from "util";
import { parse as parseComment } from "comment-parser";
import { findParamInImportDeclaration } from "./src/esmFunction";
import { ASTAnalyzer } from "./src/astAnalyzer";

async function analyzeFile(filePath: string) {
  try {
    const analyzer = await ASTAnalyzer.new(filePath);
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

async function main() {
  const { positionals } = parseArgs({
    args: Bun.argv,
    strict: true,
    allowPositionals: true,
  });

  const filePath = positionals[2] || "test/demo.tsx";
  //  "../../../Work/biz-mrn-food-deal/";

  if (!fs.existsSync(filePath)) {
    console.error("Error: File does not exist:", filePath);
    process.exit(1);
  }

  if (fs.statSync(filePath).isDirectory()) {
    console.error("Error: The provided path is a directory, not a file.");
    process.exit(1);
  }

  await analyzeFile(path.resolve(filePath));
}

main();
