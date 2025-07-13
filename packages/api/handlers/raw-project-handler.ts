import * as fs from 'node:fs'
import { scanEntryFilePaths } from '@module-toolbox/anaylzer'
import { Hono } from 'hono'

export const rawProjectHandler = new Hono()

rawProjectHandler.get('/entry-filepath', async (c) => {
  const filepath = c.req.query('filepath') || ''
  const exclude = c.req.query('exclude')?.split(',') || ['test', 'node_modules']
  const include = c.req.query('include')?.split(',') || ['src', 'packages']

  if (!filepath) {
    return c.json({
      status: 'error',
      message: 'filepath is required',
    }, 400)
  }

  const absolutePaths = await scanEntryFilePaths(
    filepath,
    {
      exclude,
      include,
    },
    'use module',
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

rawProjectHandler.get('/source-code', async (c) => {
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

  return c.json({
    status: 'success',
    data: content,
  })
})
