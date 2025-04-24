'use client'
'use module'

import { useGraphStore } from '@/store/graph-store'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
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
  const onSelectionChange = useGraphStore(state => state.onSelectionChange)

  // 布局
  const { setLayout } = useFlowLayout()
  const isNodesInitialized = useNodesInitialized()
  useEffect(() => {
    if (isNodesInitialized) {
      setLayout()
    }
  }, [isNodesInitialized])

  return (
    <ReactFlow
      nodesConnectable={false}
      nodesDraggable={false}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onSelectionChange={onSelectionChange}
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
