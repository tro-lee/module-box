import type { FlowNode } from '@/actions/module-flow-data'
import type { Component, Module } from '@module-toolbox/anaylzer'
import type { Edge, OnEdgesChange, OnNodesChange, OnSelectionChangeParams } from '@xyflow/react'
import getModuleFlowData from '@/actions/module-flow-data'

import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import { create } from 'zustand'
import { usePlaygroundStore } from './playground-store'

type AppNode = FlowNode

interface AppState {
  nodes: AppNode[]
  edges: Edge[]
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange
  setNodes: (nodes: AppNode[]) => void
  setEdges: (edges: Edge[]) => void
  onSelectionChange: (params: OnSelectionChangeParams<AppNode, Edge>) => void
}

interface FlowState {
  selectedComponents: Array<Component>
  selectedModules: Array<Module>
}

export const useFlowStore = create<FlowState & AppState>((set, get) => {
  // 订阅 explorer-store 的变化
  usePlaygroundStore.subscribe(async (state) => {
    if (state.selectedRelativePath) {
      const { nodes, edges } = await getModuleFlowData(`${state.rootPath}/${state.selectedRelativePath || ''}`)
      set({ nodes, edges })
    }
  })

  return {
    // State
    selectedComponents: [],
    selectedModules: [],

    // React Flow 基础相关
    nodes: [],
    edges: [],
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      })
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      })
    },
    onSelectionChange: ({ nodes, edges }) => {
      const selectedComponents = [] as Component[]
      const selectedModules = [] as Module[]

      nodes.forEach((node) => {
        const { data } = node
        if (data?.component) {
          selectedComponents.push(data.component)
        }

        if (data?.module) {
          selectedModules.push(data.module)
        }
      })

      set({
        selectedComponents,
        selectedModules,
      })
    },
    setNodes: (nodes) => {
      set({ nodes })
    },
    setEdges: (edges) => {
      set({ edges })
    },
  }
})
