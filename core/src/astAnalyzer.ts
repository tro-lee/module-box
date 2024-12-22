import { NodePath, parse, ParseResult, traverse } from "@babel/core";
import {
  Comment,
  FunctionDeclaration,
  ImportDeclaration,
  TSInterfaceDeclaration,
  TSTypeAliasDeclaration,
  TSTypeElement,
} from "@babel/types";
import path from "path";

export type FunctionDeclarationWithComment = {
  name: string;
  functionDeclaration: FunctionDeclaration;
  leadingComment: Comment | undefined;
};

export type InterfaceDeclarationWithComment = {
  name: string;
  tsTypeElements: TSTypeElement[];
  leadingComment: Comment | undefined;
};

export type Context = {
  interfaceDeclarations: InterfaceDeclarationWithComment[];
  functionDeclarations: FunctionDeclarationWithComment[];
  importDeclarations: ImportDeclaration[];
};

const ASTAnalyzerMapCache = new Map<string, ASTAnalyzer>();

// 用于分析出文件的AST
export class ASTAnalyzer {
  private ast: ParseResult | null = null;
  private filePath: string;
  context: Context = {
    interfaceDeclarations: [],
    functionDeclarations: [],
    importDeclarations: [],
  };

  private constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  private parseCode(sourceCode: string): ParseResult | null {
    return parse(sourceCode, {
      sourceType: "module",
      plugins: ["@babel/plugin-syntax-import-source"],
      presets: ["@babel/preset-typescript", "@babel/preset-react"],
      filename: this.filePath,
    });
  }

  private parseTSInterfaceOrTSTypeAlias(
    path: NodePath<TSTypeAliasDeclaration | TSInterfaceDeclaration>,
  ): InterfaceDeclarationWithComment {
    const fields: Array<TSTypeElement> = [];

    if (path.node.type === "TSTypeAliasDeclaration") {
      const typeAnnotation = path.node.typeAnnotation;
      if (typeAnnotation?.type === "TSTypeLiteral") {
        fields.push(...typeAnnotation.members);
      }
    } else if (path.node.type === "TSInterfaceDeclaration") {
      fields.push(...path.node.body.body);
    }

    return {
      name: path.node.id?.name || "",
      tsTypeElements: fields,
      leadingComment: path.node.leadingComments?.at(-1),
    };
  }

  private async initialize(): Promise<Context> {
    const sourceCode = await Bun.file(this.filePath).text();
    this.ast = this.parseCode(sourceCode);
    if (!this.ast) {
      throw new Error("AST parsing failed");
    }

    const self = this;

    const imports: ImportDeclaration[] = [];
    const functionsWithComment: FunctionDeclarationWithComment[] = [];
    const interfacesWithComment: InterfaceDeclarationWithComment[] = [];

    traverse(this.ast!, {
      ImportDeclaration(path: NodePath<ImportDeclaration>) {
        imports.push(path.node);
      },
      FunctionDeclaration(path: NodePath<FunctionDeclaration>) {
        let leadingComments = path.node.leadingComments;
        if (path.parent?.type === "ExportNamedDeclaration") {
          leadingComments = path.parent.leadingComments;
        }

        const lastComment = leadingComments?.at(-1);
        functionsWithComment.push({
          name: path.node.id?.name || "",
          functionDeclaration: path.node,
          leadingComment: lastComment,
        });
      },
      TSTypeAliasDeclaration(path: NodePath<TSTypeAliasDeclaration>) {
        const result = self.parseTSInterfaceOrTSTypeAlias(path);
        interfacesWithComment.push(result);
      },
      TSInterfaceDeclaration(path: NodePath<TSInterfaceDeclaration>) {
        const result = self.parseTSInterfaceOrTSTypeAlias(path);
        interfacesWithComment.push(result);
      },
    });

    this.context = {
      interfaceDeclarations: interfacesWithComment,
      functionDeclarations: functionsWithComment,
      importDeclarations: imports,
    };
    return this.context;
  }

  static async scan(filePath: string): Promise<ASTAnalyzer> {
    if (ASTAnalyzerMapCache.has(filePath)) {
      return ASTAnalyzerMapCache.get(filePath)!!;
    }

    const analyzer = new ASTAnalyzer(filePath);
    ASTAnalyzerMapCache.set(filePath, analyzer);

    await analyzer.initialize();
    return analyzer;
  }

  get comments(): Comment[] {
    return this.ast?.comments || [];
  }
}
