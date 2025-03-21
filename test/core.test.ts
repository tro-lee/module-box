import { test } from "bun:test";
import {
  getEntryFilePathsByDir,
  transformFilePathsToModuleAndComponent,
} from "../packages/library/index";
import path from "path";

test("ast Test", async () => {
  const entryFiles = await getEntryFilePathsByDir(
    "/Users/trolee/Documents/module-box",
    {
      exclude: ["test", "node_modules"],
      include: ["src", "packages"],
    }
  );

  const result = await transformFilePathsToModuleAndComponent(
    entryFiles
  );

  const file = Bun.file(path.join(__dirname, "../public/test.json"));
  await Bun.write(file, JSON.stringify(result, null, 2));
  // for (const module of Array.from(modules.values())) {
  //   if (module.type === "LocalModule") {
  //     const component = components.get(module.componentKey);
  //     const filePath = Bun.file(
  //       path.join(__dirname, "./demo/", module.componentName + ".demo.md")
  //     );

  //     if (component) {
  //       const doc = await generateModuleDoc(module, components);
  //       await Bun.write(filePath, doc);
  //     }
  //   }
  // }
});
