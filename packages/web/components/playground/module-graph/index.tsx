'use client'
'use module'

import type { GraphStore } from '@/store/graph-store'
import type { Component, Module } from 'module-toolbox-library'
import { useGraphStore } from '@/store/graph-store'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useOnSelectionChange,
} from '@xyflow/react'
import React, { memo, useEffect } from 'react'
import { CustomNodeType } from './custom-node'
import { useFlowLayout, useInitialGraphData } from './hooks'

import '@xyflow/react/dist/style.css'

export function ModuleGraphSkeleton() {
  return <div>Loading...</div>
}

function selector(state: GraphStore) {
  return {
    nodes: state.nodes,
    edges: state.edges,
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
  }
}

// 核心流程图部分
function CoreFlow() {
  // 布局
  const { setLayout } = useFlowLayout()
  const isNodesInitialized = useNodesInitialized()

  useEffect(() => {
    if (isNodesInitialized) {
      setLayout()
    }
  }, [isNodesInitialized])

  // 配置节点选择
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodes } = useGraphStore()

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
