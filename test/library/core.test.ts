import path from 'node:path'
import { test } from 'bun:test'
import {
  scanEntryFilePathsByDir,
  transformFilePathsToCoreData,
  transformProjectPathToDocument,
} from '../../packages/anaylzer'

test.skip('ast Test', async () => {
  const entryFiles = await scanEntryFilePathsByDir(
    '/Users/trolee/Documents/Code/module-box',
    {
      exclude: ['test', 'node_modules'],
      include: ['src', 'packages'],
    },
    'use module',
  )

  const result = await transformFilePathsToCoreData(
    entryFiles,
  )

  const file = Bun.file(path.join(__dirname, './dist/test.json'))
  await Bun.write(file, JSON.stringify(result, null, 2))
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
})

test('transformProjectPathToDocument', async () => {
  const result = await transformProjectPathToDocument('/Users/trolee/Documents/Code/module-box/packages/web', {
    exclude: ['dist', 'node_modules'],
    include: ['app', 'components', 'store', 'actions'],
  })

  console.log(result)
}, { timeout: 0 })
