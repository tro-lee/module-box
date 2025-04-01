import type { Node } from '@xyflow/react'
import type { Component, Module } from 'module-toolbox-library'
import { API_URL } from '@/lib/constants'

// 查询某文件目录下的模块

export async function getNodesByPath(path: string): Promise<Node[]> {
  const response = await fetch(`${API_URL}/modules-by-path?filepath=${path}`)
  const data = await response.json()
  if (data.status === 'success') {
    const { modules, components } = data.data as { modules: Record<string, Module>, components: Record<string, Component> }
    const nodes = [] as Node[]
    for (const module of Object.values(modules)) {
      nodes.push({
        id: module.key,
        data: { node: module, type: 'module' },
        position: { x: 0, y: 0 },
      })
    }
    for (const component of Object.values(components)) {
      nodes.push({
        id: component.componentKey,
        data: { node: component, type: 'component' },
        position: { x: 0, y: 0 },
      })
    }
    return nodes
  }
  else {
    console.error(data.message)
    return []
  }
}
