import * as fs from 'node:fs'
import { getAnaylzeSolutionItemGraph, getExplainCodeGraph, getInitSolutionGraph } from '@module-toolbox/graph'
import { checkpointer } from '@module-toolbox/lib'
import { Hono } from 'hono'
import { streamSSE, streamText } from 'hono/streaming'

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

      for await (const responses of await responseStream) {
        if (stream.closed || stream.aborted || signal.aborted) {
          controller.abort()
          return
        }
        await stream.write(responses[0].content)
      }
    }
    catch (err) {
      console.log('流中断/结束')
    }
    finally {
      console.log(filepath, '流结束')
      stream.close()
    }
  })
})

graphHandler.post('/init-solution-sse', async (c) => {
  const id = c.req.query('id') || ''
  const body = await c.req.parseBody()
  const img = body.img

  if (!id || !img || typeof img !== 'string') {
    return c.json({
      status: 'error',
      message: 'img is required',
    }, 400)
  }

  return streamSSE(c, async (stream) => {
    const controller = new AbortController()
    const { signal } = controller

    try {
      const graph = await getInitSolutionGraph({ checkpointer })
      const responseStream = graph.stream({
        imageBase64: img,
      }, {
        streamMode: 'messages',
        signal,
        configurable: {
          thread_id: id,
        },
      })

      for await (const responses of await responseStream) {
        if (stream.closed || stream.aborted || signal.aborted) {
          controller.abort()
          return
        }

        await stream.writeSSE({
          data: responses[0].content,
          event: responses[1].langgraph_node,
        })
      }
    }
    catch (err) {
      console.log('流中断/结束')
    }
    finally {
      console.log('流结束')
      stream.close()
    }
  })
})

graphHandler.post('/anaylze-solution-item-stream', async (c) => {
  const id = c.req.query('id') || ''
  const body = await c.req.parseBody()
  const img = body.img

  if (!id || !img || typeof img !== 'string') {
    return c.json({
      status: 'error',
      message: 'img is required',
    }, 400)
  }

  return streamText(c, async (stream) => {
    const controller = new AbortController()
    const { signal } = controller

    try {
      const graph = await getAnaylzeSolutionItemGraph({ checkpointer })
      const responseStream = graph.stream({
        imageBase64: img,
      }, {
        streamMode: 'messages',
        signal,
        configurable: {
          thread_id: id,
        },
      })

      for await (const responses of await responseStream) {
        if (stream.closed || stream.aborted || signal.aborted) {
          controller.abort()
          return
        }

        await stream.write(
          responses[0].content,
        )
      }
    }
    catch (err) {
      console.log('流中断/结束')
    }
    finally {
      console.log('流结束')
      stream.close()
    }
  })
})
