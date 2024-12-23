import { test } from "bun:test";
import { getEntryFilePathsByDir } from "../core/src/entry";
import { scanAstByFile } from "../core/src/ast";
import type { GlobalContext } from "../core/src/types";
import { transformFunctionToModuleComponent } from "../core/src/transformer";

test.skip("entry Test", async () => {
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

  const globalContext: GlobalContext = new Map();
  for (const file of entryFiles) {
    const ast = await scanAstByFile(file);
    globalContext.set(file, ast);
  }

  for (const fileContext of globalContext.values()) {
    const moduleComponents = await transformFunctionToModuleComponent(
      fileContext,
      globalContext,
    );
  }
});
