'use client'
'use module'

import type { Component, Module } from 'module-toolbox-library'
import { useGraphStore } from '@/store/graph-store'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useOnSelectionChange,
} from '@xyflow/react'
import React, { memo, useEffect } from 'react'
import { CustomNodeType } from './custom-node'

import { useFlowLayout } from './hooks'

import '@xyflow/react/dist/style.css'

export function ModuleGraphSkeleton() {
  return <div>Loading...</div>
}

// 核心流程图部分
function CoreFlow() {
  // 配置节点选择
  const nodes = useGraphStore(state => state.nodes)
  const edges = useGraphStore(state => state.edges)
  const onNodesChange = useGraphStore(state => state.onNodesChange)
  const onEdgesChange = useGraphStore(state => state.onEdgesChange)
  const setSelectedNodes = useGraphStore(state => state.setSelectedNodes)

  // 布局
  const { setLayout } = useFlowLayout()
  const isNodesInitialized = useNodesInitialized()

  useEffect(() => {
    if (isNodesInitialized) {
      setLayout()
    }
  }, [isNodesInitialized])

  useOnSelectionChange({
    onChange: (selection) => {
      const selectedNodes: Array<Module | Component> = []
      for (const node of selection.nodes) {
        if (node.data.node) {
          selectedNodes.push(node.data.node as Module | Component)
        }
      }
      setSelectedNodes(selectedNodes)
    },
  })

  return (
    <ReactFlow
      nodesConnectable={false}
      nodesDraggable={false}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      nodeTypes={CustomNodeType}
    >
      <Background variant={BackgroundVariant.Cross} gap={50} />
    </ReactFlow>
  )
}

// 包裹下，提供 ReactFlowProvider 上下文
export const ModuleGraphComponent = memo(() => {
  return (
    <ReactFlowProvider>
      <CoreFlow />
    </ReactFlowProvider>
  )
})
