import { FunctionDeclaration } from "@babel/types";

class ModulesAnalyzer {
  functionDeclarations: FunctionDeclaration[] = [];

  constructor(private readonly filePath: string) {
    this.functionDeclarations = [];
  }

  public async initialize() {
  }
}
