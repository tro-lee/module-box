import { transformProjectPathToDocument } from '@module-toolbox/anaylzer'
import { Hono } from 'hono'

export const codebaseHandler = new Hono()

let isInitialized = false
codebaseHandler.get('/init-embed-text', async (c) => {
  const projectPath = c.req.query('projectpath') || ''
  if (!projectPath) {
    return c.json({
      status: 'error',
      message: 'projectPath is required',
    }, 400)
  }

  const documents = await transformProjectPathToDocument(projectPath, {
    exclude: ['node_modules', 'dist', 'build'],
    include: ['src', 'lib', 'app', 'components'],
  })

  // const promises = documents.map(doc => addDocument(doc.pageContent, doc.id))
  // await Promise.all(promises)

  isInitialized = true

  return c.json({
    status: 'success',
    message: 'Codebase initialized successfully',
  })
})
