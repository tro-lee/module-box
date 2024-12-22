import { test } from "bun:test";
import { getEntryFilePathsByDir } from "../core/src/entry";

test("core Test", async () => {
  const entryFiles = await getEntryFilePathsByDir(
    "/Users/trolee02/Documents/Work/biz-mrn-food-deal",
    {
      exclude: ["test", "node_modules"],
      include: ["src", "core"],
    }
  );

  console.log(entryFiles.length);
});
