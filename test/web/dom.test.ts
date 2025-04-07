import { expect, test } from 'bun:test'

test.skip('dom test', () => {
  const div = document.createElement('div')
  div.innerHTML = 'Hello, world!'
  document.body.appendChild(div)

  expect(div.innerHTML).toBe('Hello, world!')
})
