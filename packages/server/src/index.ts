import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  getEntryFilePathsByDir,
  transformFilePathsToModuleAndComponent,
} from 'library'

import { LLMService } from './services/llm.service'

const app = new Hono()
const llmService = new LLMService()

app.use('/*', cors())

app.get('/modules', async (c) => {
  const entryFiles = await getEntryFilePathsByDir(
    '/Users/trolee02/Documents/Work/biz-mrn-food-deal',
    {
      exclude: ['test', 'node_modules'],
      include: ['src', 'core'],
    },
  )

  const { modules, components } = await transformFilePathsToModuleAndComponent(
    entryFiles,
  )

  return c.json({
    status: 'success',
    data: modules,
  })
})

app.post('/ai/chat', async (c) => {
  const { message } = await c.req.json()

  if (!message) {
    return c.json({ error: 'Message is required' }, 400)
  }

  try {
    const response = await llmService.chat(message)
    return c.json({ response })
  }
  catch (error) {
    console.error('Chat error:', error)
    return c.json({ error: 'Failed to process chat request' }, 500)
  }
})

const port = Number.parseInt(process.env.PORT || '3000')
console.log(`Server is running on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}
