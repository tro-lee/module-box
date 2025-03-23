import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  getEntryFilePathsByDir,
  transformFilePathsToModuleAndComponent,
} from 'module-toolbox-library'

const app = new Hono()

app.use('/*', cors({
  origin: 'localhost', // 当前服务仅限本地运行，不做身份验证
}))

app.get('/modules', async (c) => {
  const filepath = c.req.query('filepath') || ''
  const exclude = c.req.query('exclude')?.split(',') || ['test', 'node_modules']
  const include = c.req.query('include')?.split(',') || ['src', 'packages']

  if (!filepath) {
    return c.json({
      status: 'error',
      message: 'filepath is required',
    }, 400)
  }

  const entryFiles = await getEntryFilePathsByDir(
    filepath,
    {
      exclude,
      include,
    },
  )
  const result = await transformFilePathsToModuleAndComponent(
    entryFiles,
  )

  return c.json({
    status: 'success',
    data: result,
  }, {
    headers: {
      'Cache-Control': 'max-age=600', // 十分钟强制缓存，后面改为根据文件内容进行ETag协商缓存
    },
  })
})

const port = Number.parseInt(process.env.PORT || '3000')
console.log(`Server is running on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}
