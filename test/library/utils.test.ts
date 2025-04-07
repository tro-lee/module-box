import { expect, test } from 'bun:test'
import { findNearestProjectRoot } from '../../packages/library/src/utils'

test('findNearestProjectRoot', () => {
  const projectRoot = '/Users/trolee/Documents/Code/module-box/packages/web'
  const filePath = `${projectRoot}/components/playground/detail-card.tsx`

  const testProjectRoot = findNearestProjectRoot(filePath)
  expect(testProjectRoot).toBe(projectRoot)
})
