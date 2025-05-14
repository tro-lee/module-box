import { transformFilePathsToCoreData } from '@module-toolbox/anaylzer'
import { Hono } from 'hono'

export const flowHandler = new Hono()

flowHandler.get('/modules', async (c) => {
  const filepath = c.req.query('filepath') || ''

  if (!filepath) {
    return c.json({
      status: 'error',
      message: 'filepath is required',
    }, 400)
  }

  const result = await transformFilePathsToCoreData(
    [filepath],
  )

  return c.json({
    status: 'success',
    data: result,
  })
})
