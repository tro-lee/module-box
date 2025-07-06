import type { Component, Hook, Module } from '@module-toolbox/anaylzer'
import type { Edge, Node } from '@xyflow/react'
import { API_URL, ROOT_PATH } from '@/lib/constants'
import { compact } from 'lodash'

// 查询某文件目录下的模块

interface FetchNodesByPathResult {
  modules: Record<string, Module>
  components: Record<string, Component>
  hooks: Record<string, Hook>
}
async function fetchNodesByPath(path: string): Promise<FetchNodesByPathResult> {
  try {
    const url = new URL('/flow/modules', API_URL)
    url.searchParams.append('filepath', path)
    const response = await fetch(url)

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

export type FlowNode = Node & {
  type: 'module' | 'component' | 'hook'
  data: {
    module?: Module
    component?: Component
    hook?: Hook
  }
}

export default async function getModuleFlowData(path: string): Promise<{ nodes: FlowNode[], edges: Edge[] }> {
  // 兜底
  if (!path) {
    return { nodes: [], edges: [] }
  }

  const absolutePath = `${ROOT_PATH}/${path}`
  const { modules, components } = await fetchNodesByPath(absolutePath)

  // 处理节点部分
  const createNode = (id: string, data: (FlowNode)['data'], type: FlowNode['type']): FlowNode => ({
    id,
    position: { x: 0, y: 0 },
    data,
    type,
  })

  const nodes: FlowNode[] = compact([
    // 模块节点
    ...Object.values(modules).map(module => createNode(module.moduleKey, { module, type: 'module' }, 'module')),
    // 组件和Hook节点
    ...Object.values(components).flatMap((component) => {
      const componentNode = createNode(component.componentKey, { component, type: 'component' }, 'component')
      // const hookNodes = component.type === 'LocalComponent'
      //   ? component.referencedHookKeys.map((hookKey) => {
      //       const hook = hooks[hookKey]
      //       return hook ? createNode(`${component.componentKey}-${hook.hookKey}`, { hook, type: 'hook' }, 'hook') : null
      //     }).filter(Boolean)
      //   : []
      return [componentNode]
    }),
  ])

  // 处理边部分
  const edges: Edge[] = [
    ...Object.values(modules).map(module => ({
      id: `edge-${module.moduleKey}-${module.componentKey}`,
      source: module.moduleKey,
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
