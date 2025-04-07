import type { Edge, Node } from '@xyflow/react'
import type { Component, Module } from 'module-toolbox-library'
import { API_URL } from '@/lib/constants'

// 查询某文件目录下的模块

async function fetchNodesByPath(path: string): Promise<{ modules: Record<string, Module>, components: Record<string, Component> }> {
  try {
    const response = await fetch(`${API_URL}/modules-by-path?filepath=${path}`)
    const data = await response.json()
    if (data.status === 'success') {
      const { modules, components } = data.data as { modules: Record<string, Module>, components: Record<string, Component> }
      return { modules, components }
    }
  }
  catch (error) {
    console.error(error)
  }

  return { modules: {}, components: {} }
}

export default async function getModuleGraphData(path: string): Promise<{ nodes: Node[], edges: Edge[] }> {
  const { modules, components } = await fetchNodesByPath(path)

  // 处理节点部分
  const nodes: Node[] = []

  Object.values(modules).forEach((module) => {
    nodes.push({
      id: module.key,
      position: { x: 0, y: 0 },
      data: { module, node: module, type: 'module' },
      type: 'module',
    })
  })
  Object.values(components).forEach((component) => {
    nodes.push({
      id: component.componentKey,
      position: { x: 0, y: 0 },
      data: { component, node: component, type: 'component' },
      type: 'component',
    })
  })

  // 处理边部分
  const edges: Edge[] = []

  Object.values(modules).forEach((module) => {
    edges.push({
      id: `edge-${module.key}-${module.componentKey}`,
      source: module.key,
      target: module.componentKey,
      animated: true,
    })
  })
  Object.values(components).forEach((component) => {
    if (component.type === 'LocalComponent') {
      for (const jsxElement of component.componentJSXElements) {
        edges.push({
          id: `edge-${component.componentKey}-${jsxElement.componentKey}`,
          source: component.componentKey,
          target: jsxElement.componentKey,
        })
      }
    }
  })

  return { nodes, edges }
}
