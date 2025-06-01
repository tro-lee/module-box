import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { codebaseHandler } from './handlers/codebase-handler'
import { flowHandler } from './handlers/flow-handler'
import { graphHandler } from './handlers/graph-handler'
import { rawProjectHandler } from './handlers/raw-project-handler'

const app = new Hono()

app.use('/*', cors())
app.route('/raw-project', rawProjectHandler)
app.route('/graph', graphHandler)
app.route('/flow', flowHandler)
app.route('/codebase', codebaseHandler)

const port = Number.parseInt(process.env.PORT || '3000')

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 255,
}
