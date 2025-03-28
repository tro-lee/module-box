'use server'
import type { Component, Module } from 'module-toolbox-library'
import fs from 'node:fs'
import path from 'node:path'

const API_URL = process.env.API_URL || 'http://localhost:3000'

export async function getModulesAndComponents(): Promise<{
  modules: Record<string, Module>
  components: Record<string, Component>
}> {
  return new Promise((resolve) => {
    fs.readFile(
      path.join(process.cwd(), './temp/test.json'),
      'utf-8',
      (err, json) => {
        if (err) {
          console.error('读取文件失败', err)
          resolve({
            modules: {},
            components: {},
          })
        }

        const data = JSON.parse(json)
        resolve({
          modules: data.modules || {},
          components: data.components || {},
        })
      },
    )
  })
}

interface Element {
  id: string
  isSelectable: boolean
  name: string
  children?: Element[]
}

async function getEntryFilePaths(): Promise<{
  absolutePaths: string[]
  relativePaths: string[]
}> {
  const response = await fetch(`${API_URL}/entry-file-paths?filepath=/Users/trolee/Documents/module-box`)
  const data = await response.json()
  if (data.status === 'success') {
    return data.data
  }
  else {
    console.error(data.message)
    return {
      absolutePaths: [],
      relativePaths: [],
    }
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

export async function getModuleExplorerElements(): Promise<Element[]> {
  const { relativePaths } = await getEntryFilePaths()
  return pathsToTree(relativePaths)
}
