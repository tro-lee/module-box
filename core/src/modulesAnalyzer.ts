import { Context, FunctionDeclarationWithComment } from "./astAnalyzer";
import { parse as parseComment } from "comment-parser";

// 用于分析出模块，同时处理模块关系
export class ModulesAnalyzer {
  private functionWithComment: FunctionDeclarationWithComment | null = null;
  private context: Context | null = null;

  private constructor() {}

  public static async new(
    func: FunctionDeclarationWithComment,
    context: Context,
  ): Promise<ModulesAnalyzer | null> {
    if (!func.leadingComment?.value) return null;

    const comments = parseComment("/*" + func.leadingComment.value + "*/");

    if (!comments[0]?.tags) return null;

    const analyzer = new ModulesAnalyzer();
    analyzer.functionWithComment = func;
    analyzer.context = context;

    return analyzer;
  }
}
