import { test } from "bun:test";
import {
  getEntryFilePathsByDir,
  transformFilePathsToModuleAndComponent,
  generateModuleDoc,
} from "../packages/library/index";
import path from "path";

test("ast Test", async () => {
  const entryFiles = await getEntryFilePathsByDir(
    "/Users/trolee02/Documents/Work/biz-mrn-food-deal",
    {
      exclude: ["test", "node_modules"],
      include: ["src", "core"],
    }
  );

  const { modules, components } = await transformFilePathsToModuleAndComponent(
    entryFiles
  );

  for (const module of Array.from(modules.values())) {
    if (module.type === "LocalModule") {
      const component = components.get(module.componentKey);
      const filePath = Bun.file(
        path.join(__dirname, "./demo/", module.componentName + ".demo.md")
      );

      if (component) {
        const doc = await generateModuleDoc(module, components);
        await Bun.write(filePath, doc);
      }
    }
  }
});
