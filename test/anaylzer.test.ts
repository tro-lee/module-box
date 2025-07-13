import { scanEntryFunction } from '@module-toolbox/anaylzer/src/scan/entry-function'
import { test } from 'bun:test'

const entryFilePath = '/Users/trolee/Documents/Code/module-box/packages/web/components/'

test('test scan entry-function', async () => {
  await scanEntryFunction(entryFilePath, '@export')
})
