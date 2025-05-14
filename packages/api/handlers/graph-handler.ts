import * as fs from 'node:fs'
import { getExplainCodeGraph, getInitSolutionGraph } from '@module-toolbox/graph'
import { Hono } from 'hono'
import { streamText } from 'hono/streaming'

export const graphHandler = new Hono()

graphHandler.get('/explain-code-stream', async (c) => {
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
    const controller = new AbortController()
    const { signal } = controller

    try {
      const graph = await getExplainCodeGraph()
      const responseStream = graph.stream({
        messages: [['user', content]],
      }, {
        streamMode: 'messages',
        signal,
      })

      console.log(filepath, '流开始')

      // 创建一个写入函数，处理写入错误
      const writeWithErrorHandling = async (text: string) => {
        if (stream.closed || stream.aborted) {
          controller.abort()
          return
        }
        await stream.write(text)
      }

      for await (const responses of await responseStream) {
        // 如果已经中断，则不再处理
        if (signal.aborted) {
          break
        }

        await writeWithErrorHandling(responses[0].content)
      }
    }
    catch (err) {
      // 处理未知错误类型
      const error = err as Error
      console.log('流中断/结束')
    }
    finally {
      console.log(filepath, '流结束')
    }
  })
})

graphHandler.post('/init-solution', async (c) => {
  const body = await c.req.parseBody()
  const img = body.img

  if (!img || typeof img !== 'string') {
    return c.json({
      status: 'error',
      message: 'img is required',
    }, 400)
  }

  return streamText(c, async (stream) => {
    const controller = new AbortController()
    const { signal } = controller

    const graph = await getInitSolutionGraph()

    const responseStream = graph.stream({
      imageBase64: img,
    }, {
      streamMode: 'messages',
      signal,
    })

    // 创建一个写入函数，处理写入错误
    const writeWithErrorHandling = async (text: string) => {
      if (stream.closed || stream.aborted) {
        controller.abort()
        return
      }
      await stream.write(text)
    }

    for await (const responses of await responseStream) {
      // 如果已经中断，则不再处理
      if (signal.aborted) {
        break
      }

      await writeWithErrorHandling(responses[0].content)
    }
  })
})
