import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  getEntryFilePathsByDir,
  transformFilePathsToModuleAndComponent,
} from 'module-toolbox-library'

const app = new Hono()

app.use('/*', cors())

app.get('/entry-file-paths', async (c) => {
  const filepath = c.req.query('filepath') || ''
  const exclude = c.req.query('exclude')?.split(',') || ['test', 'node_modules']
  const include = c.req.query('include')?.split(',') || ['src', 'packages']

  if (!filepath) {
    return c.json({
      status: 'error',
      message: 'filepath is required',
    }, 400)
  }

  const absolutePaths = await getEntryFilePathsByDir(
    filepath,
    {
      exclude,
      include,
    },
  )

  // 获取每个文件的相对路径
  const relativePaths = absolutePaths.map((file) => {
    return file.replace(filepath, '')
  })

  return c.json({
    status: 'success',
    data: {
      rootPath: filepath,
      relativePaths,
    },
  })
})

app.get('/modules-by-path', async (c) => {
  const filepath = c.req.query('filepath') || ''

  if (!filepath) {
    return c.json({
      status: 'error',
      message: 'filepath is required',
    }, 400)
  }

  const result = await transformFilePathsToModuleAndComponent(
    [filepath],
  )

  return c.json({
    status: 'success',
    data: result,
  })
})

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
