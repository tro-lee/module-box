import { transformFilePathsToFunction } from '@module-toolbox/anaylzer/src/transform/path-to-function'
import { test } from 'bun:test'

const entryFilePath = '/Users/trolee/Documents/Code/module-box/packages/web/components/'

test('test scan entry-function', () => {
  const functions = transformFilePathsToFunction(entryFilePath)
  console.log(functions)
})
