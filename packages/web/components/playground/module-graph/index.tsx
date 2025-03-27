'use client'
'use module'

import type { Component, Module } from 'module-toolbox-library'
import { useNodeContextStore } from '@/store/node-context-store'
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

// 核心流程图部分
function CoreFlow({
  promise,
}: {
  promise: Promise<{
    modules: Record<string, Module>
    components: Record<string, Component>
  }>
}) {
  const { initialNodes, initialEdges } = useInitialGraphData(promise)
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // 布局
  const { setLayout } = useFlowLayout()
  const isNodesInitialized = useNodesInitialized()

  useEffect(() => {
    if (isNodesInitialized) {
      setLayout()
    }
  }, [isNodesInitialized])

  // 配置节点选择
  const { setSelectedNodes } = useNodeContextStore()

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
export const ModuleGraphComponent = memo(({
  promise,
}: {
  promise: Promise<{
    modules: Record<string, Module>
    components: Record<string, Component>
  }>
}) => {
  return (
    <ReactFlowProvider>
      <CoreFlow promise={promise} />
    </ReactFlowProvider>
  )
})
