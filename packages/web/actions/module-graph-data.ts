import type { Edge, Node } from '@xyflow/react'
import type { Component, Hook, Module } from 'module-toolbox-library'
import { API_URL } from '@/lib/constants'
import { compact } from 'lodash'

// 查询某文件目录下的模块

interface FetchNodesByPathResult {
  modules: Record<string, Module>
  components: Record<string, Component>
  hooks: Record<string, Hook>
}
async function fetchNodesByPath(path: string): Promise<FetchNodesByPathResult> {
  try {
    const response = await fetch(`${API_URL}/modules-by-path?filepath=${path}`)
    const data = await response.json()
    if (data.status === 'success') {
      const { modules, components, hooks } = data.data as FetchNodesByPathResult
      return { modules, components, hooks }
    }
  }
  catch (error) {
    console.error(error)
  }

  return { modules: {}, components: {}, hooks: {} }
}

export default async function getModuleGraphData(path: string): Promise<{ nodes: Node[], edges: Edge[] }> {
  const { modules, components, hooks } = await fetchNodesByPath(path)

  // 处理节点部分
  const createNode = (id: string, data: any, type: string) => ({
    id,
    position: { x: 0, y: 0 },
    data,
    type,
  })

  const nodes: Node[] = compact([
    // 模块节点
    ...Object.values(modules).map(module => createNode(module.key, { module, type: 'module' }, 'module')),
    // 组件和Hook节点
    ...Object.values(components).flatMap((component) => {
      const componentNode = createNode(component.componentKey, { component, type: 'component' }, 'component')
      const hookNodes = component.type === 'LocalComponent'
        ? component.referencedHookKeys.map((hookKey) => {
            const hook = hooks[hookKey]
            return hook ? createNode(`${component.componentKey}-${hook.hookKey}`, { hook, type: 'hook' }, 'hook') : null
          }).filter(Boolean)
        : []
      return [componentNode, ...hookNodes]
    }),
  ])

  // 处理边部分
  const edges: Edge[] = [
    ...Object.values(modules).map(module => ({
      id: `edge-${module.key}-${module.componentKey}`,
      source: module.key,
      target: module.componentKey,
      animated: true,
    })),
    ...Object.values(components).flatMap((component) => {
      if (component.type === 'LocalComponent') {
        const componentEdges = component.referencedComponentKeys.map(refKey => ({
          id: `edge-${component.componentKey}-${refKey}`,
          source: component.componentKey,
          target: refKey,
        }))
        const hookEdges = component.referencedHookKeys.map(hookKey => ({
          id: `edge-${component.componentKey}-${hookKey}`,
          source: component.componentKey,
          target: `${component.componentKey}-${hookKey}`,
        }))
        return [...componentEdges, ...hookEdges]
      }
      return []
    }),
  ]

  return { nodes, edges }
}
