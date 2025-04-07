import { act, render, screen } from '@testing-library/react'
import { expect, test } from 'bun:test'

test.skip('测试模块图', async () => {
  const promise = Promise.resolve({
    modules: {},
    components: {},
  })

  await act(async () => {
    render(
      <div data-testid="module-graph">
      </div>,
    )
  })

  const myComponent = screen.getByTestId('module-graph')
  expect(myComponent).toBeInTheDocument()
})
