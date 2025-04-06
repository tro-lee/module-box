import type { Edge, Node, OnEdgesChange, OnNodesChange } from '@xyflow/react'
import type { Component, Module } from 'module-toolbox-library'
import getModuleGraphData from '@/actions/module-graph-data'

import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import { create } from 'zustand'
import { useExplorerStore } from './explorer-store'

type AppNode = Node

interface AppState {
  nodes: AppNode[]
  edges: Edge[]
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange
  setNodes: (nodes: AppNode[]) => void
  setEdges: (edges: Edge[]) => void
}

interface GraphState {
  selectedNodes: Array<Module | Component>
}

interface GraphActions {
  setSelectedNodes: (nodes: Array<Module | Component>) => void
}

export type GraphStore = GraphState & GraphActions & AppState

export const useGraphStore = create<GraphStore>((set, get) => {
  // 订阅 explorer-store 的变化
  useExplorerStore.subscribe(async (state) => {
    if (state.selectedRelativeFilePath) {
      const { nodes, edges } = await getModuleGraphData(state.getSelectedAbsolutePath())
      set({ nodes, edges })
    }
  })

  return {
    // State
    selectedNodes: [],

    // Actions
    setSelectedNodes: (nodes: Array<Module | Component>) =>
      set({ selectedNodes: nodes }),

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
    setNodes: (nodes) => {
      set({ nodes })
    },
    setEdges: (edges) => {
      set({ edges })
    },
  }
})
