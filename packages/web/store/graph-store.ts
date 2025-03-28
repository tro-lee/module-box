import type { Edge, Node, OnConnect, OnEdgesChange, OnNodesChange } from '@xyflow/react'
import type { Component, Module } from 'module-toolbox-library'
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react'
import { create } from 'zustand'

import { useExplorerStore } from './explorer-store'

type AppNode = Node

interface AppState {
  nodes: AppNode[]
  edges: Edge[]
  onNodesChange: OnNodesChange<AppNode>
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
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
  useExplorerStore.subscribe((state) => {
    if (state.selectedRelativeFilePath) {
      // 这里可以根据 selectedFile 来更新 selectedNodes
      // 暂时设置为空数组，您可以根据实际需求来实现具体的逻辑
      set({ nodes: [], edges: [] })
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
    onConnect: (connection) => {
      set({
        edges: addEdge(connection, get().edges),
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
