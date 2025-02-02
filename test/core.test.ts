import { test } from "bun:test";
import {
  getEntryFilePathsByDir,
  transformFilePathsToModule,
} from "../packages/library/index";

test("ast Test", async () => {
  const entryFiles = await getEntryFilePathsByDir(
    "/Users/trolee02/Documents/Work/biz-mrn-food-deal",
    {
      exclude: ["test", "node_modules"],
      include: ["src", "core"],
    }
  );

  const { modules, components } = await transformFilePathsToModule(entryFiles);
  console.log(modules);
  console.log(components);
});
