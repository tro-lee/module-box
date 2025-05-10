import * as fs from 'node:fs'
import { getExplainCodeGraph } from '@module-toolbox/ai'
import {
  transformFilePathsToCoreData,
} from '@module-toolbox/anaylzer'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamText } from 'hono/streaming'
import { rawProjectHandler } from './handlers/raw-project-handler'

const app = new Hono()

app.use('/*', cors())
app.route('/raw-project', rawProjectHandler)

app.get('/modules-by-path', async (c) => {
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

app.get('/explain-code-by-location-stream', async (c) => {
  const filepath = c.req.query('filepath') || ''
  const locStart = Number(c.req.query('locStart') || '')
  const locEnd = Number(c.req.query('locEnd') || '')

  if (!filepath || Number.isNaN(locStart) || Number.isNaN(locEnd)) {
    return c.json({
      status: 'error',
      message: 'filepath, locStart and locEnd are required',
    }, 400)
  }

  const code = fs.readFileSync(filepath, 'utf-8')
  const content = code.slice(locStart, locEnd)

  // 创建流式响应
  return streamText(c, async (stream) => {
    try {
      const graph = await getExplainCodeGraph()
      const responseStream = graph.stream({
        messages: [['user', content]],
      }, {
        streamMode: 'messages',
      })

      for await (const responses of await responseStream) {
        await stream.write(responses[0].content)
        process.stdout.write(responses[0].content)
      }
    }
    catch (err) {
      // 处理未知错误类型
      const error = err as Error
      // 发送错误消息
      await stream.write(`data: {"status":"error", "message": ${JSON.stringify(error?.message || '未知错误')}}\n\n`)
    }
  })
})

const port = Number.parseInt(process.env.PORT || '3000')

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 255,
}
