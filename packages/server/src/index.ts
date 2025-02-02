import { Hono } from 'hono'
import { cors } from 'hono/cors'

import {
  FileContext,
  getEntryFilePathsByDir,
  scanAstByFileWithAutoExtension,
  transformFileContextToModuleComponent,
} from "library";

import type { ModuleComponent } from "library";

const app = new Hono()

app.use(cors())

app.get('/modules', async (c) => {
  const entryFiles = await getEntryFilePathsByDir(
    "/Users/trolee02/Documents/Work/biz-mrn-food-deal",
    {
      exclude: ["test", "node_modules"],
      include: ["src", "core"],
    }
  );

  const globalContext: Map<string, FileContext> = new Map();
  for (const file of entryFiles) {
    const ast = await scanAstByFileWithAutoExtension(file);
    if (!ast) continue;
    globalContext.set(file, ast);
  }

  const moduleList: ModuleComponent[] = [];
  for (const fileContext of Array.from(globalContext.values())) {
    const moduleComponents = await transformFileContextToModuleComponent(
      fileContext
    );
    moduleList.push(...moduleComponents);
  }

  return c.json({
    status: "success",
    data: moduleList,
  });
})

export default app
