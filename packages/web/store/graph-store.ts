import type { CustomGraphNode } from '@/actions/module-graph-data'
import type { Edge, OnEdgesChange, OnNodesChange, OnSelectionChangeParams } from '@xyflow/react'
import type { Component, Module } from 'module-toolbox-library'
import getModuleGraphData from '@/actions/module-graph-data'

import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import { create } from 'zustand'
import { useExplorerStore } from './explorer-store'

type AppNode = CustomGraphNode

interface AppState {
  nodes: AppNode[]
  edges: Edge[]
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange
  setNodes: (nodes: AppNode[]) => void
  setEdges: (edges: Edge[]) => void
  onSelectionChange: (params: OnSelectionChangeParams<AppNode, Edge>) => void
}

interface GraphState {
  selectedComponents: Array<Component>
  selectedModules: Array<Module>
}

export const useGraphStore = create<GraphState & AppState>((set, get) => {
  // 订阅 explorer-store 的变化
  useExplorerStore.subscribe(async (state) => {
    if (state.selectedRelativeFilePath) {
      const { nodes, edges } = await getModuleGraphData(state.getSelectedAbsolutePath())
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
