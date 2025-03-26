'use client'
'use module'

import type { Component, Module } from 'module-toolbox-library'
import { useNodeContextStore } from '@/store/node-context-store'
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useOnSelectionChange,
} from '@xyflow/react'
import React, { memo } from 'react'

import { CustomNodeType } from './custom-node'
import { useFlowLayoutManager, useInitialGraphData } from './hooks'
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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useFlowLayoutManager({ nodes, edges, setNodes, setEdges })

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
      <Controls />
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

export default ModuleGraphComponent
