import type { Component, Module } from 'module-toolbox-library'
import { create } from 'zustand'
import { useExplorerStore } from './explorer-store'

interface GraphState {
  selectedNodes: Array<Module | Component>
  setSelectedNodes: (nodes: Array<Module | Component>) => void
}

export const useGraphStore = create<GraphState>((set) => {
  // 订阅 explorer-store 的变化
  useExplorerStore.subscribe((state) => {
    if (state.selectedFile) {
      // 这里可以根据 selectedFile 来更新 selectedNodes
      // 暂时设置为空数组，您可以根据实际需求来实现具体的逻辑
      set({ selectedNodes: [] })
    }
  })

  return {
    selectedNodes: [],
    setSelectedNodes: (nodes: Array<Module | Component>) =>
      set({ selectedNodes: nodes }),
  }
})
