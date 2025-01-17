import { test } from "bun:test";
import { getEntryFilePathsByDir } from "../core/src/entry";
import { scanAstByFileWithAutoExtension } from "../core/src/ast";
import { transformFileContextToModuleComponent } from "../core/src/transform";
import type { FileContext } from "../core/src/types";

test.skip("core Test", async () => {
  const entryFiles = await getEntryFilePathsByDir(
    "/Users/trolee02/Documents/Work/biz-mrn-food-deal",
    {
      exclude: ["test", "node_modules"],
      include: ["src", "core"],
    },
  );

  console.log(entryFiles.length);
});

test("ast Test", async () => {
  const entryFiles = await getEntryFilePathsByDir(
    "/Users/trolee02/Documents/Work/biz-mrn-food-deal",
    {
      exclude: ["test", "node_modules"],
      include: ["src", "core"],
    },
  );

  const globalContext: Map<string, FileContext> = new Map();
  for (const file of entryFiles) {
    const ast = await scanAstByFileWithAutoExtension(file);
    if (!ast) continue;
    globalContext.set(file, ast);
  }

  for (const fileContext of globalContext.values()) {
    const moduleComponents = await transformFileContextToModuleComponent(
      fileContext,
    );
    console.log(moduleComponents);
  }
});
