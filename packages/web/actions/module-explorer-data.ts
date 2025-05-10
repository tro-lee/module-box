'use server'
import { API_URL, ROOT_PATH } from '../lib/constants'

// 模块资源管理器提供数据

interface Element {
  id: string
  isSelectable: boolean
  name: string
  children?: Element[]
}

async function scanEntryFilePaths(): Promise<{
  rootPath: string
  relativePaths: string[]
}> {
  try {
    const url = new URL('/raw-project/entry-filepath', API_URL)
    url.searchParams.append('filepath', ROOT_PATH)
    const response = await fetch(url)

    const data = await response.json()
    if (data.status === 'success') {
      return data.data
    }
  }
  catch (error) {
    console.error(error)
  }

  return {
    rootPath: '',
    relativePaths: [],
  }
}

function pathsToTree(paths: string[]): Element[] {
  const tree: Element[] = []
  const pathMap = new Map<string, Element>()

  paths.forEach((path) => {
    // 移除开头的斜杠并分割路径
    const parts = path.replace(/^\//, '').split('/').filter(Boolean)
    let currentPath = ''

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLastPart = index === parts.length - 1

      if (!pathMap.has(currentPath)) {
        const element: Element = {
          id: currentPath,
          isSelectable: true,
          name: part,
          children: isLastPart ? undefined : [],
        }

        if (index === 0) {
          // 第一层级直接加入树中
          tree.push(element)
        }
        else {
          // 其他层级添加到父节点的children中
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))
          const parent = pathMap.get(parentPath)
          if (parent && parent.children) {
            parent.children.push(element)
          }
        }

        pathMap.set(currentPath, element)
      }
    })
  })

  return tree
}

export default async function getModuleExplorerData(): Promise<{
  rootPath: string
  elements: Element[]
}> {
  const { relativePaths, rootPath } = await scanEntryFilePaths()
  return {
    rootPath,
    elements: pathsToTree(relativePaths),
  }
}
