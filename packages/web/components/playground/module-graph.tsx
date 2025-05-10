'use client'
'use module'

import type { Edge, Node } from '@xyflow/react'
import { useGraphStore } from '@/store/graph-store'
import Dagre from '@dagrejs/dagre'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdges,
  useNodes,
  useNodesInitialized,
  useReactFlow,
} from '@xyflow/react'
import React, { memo, useCallback, useEffect } from 'react'
import { CustomNodeType } from './module-graph-node'
import '@xyflow/react/dist/style.css'

export function ModuleGraphSkeleton() {
  return <div>Loading...</div>
}

// 布局处理
function layoutProcess(
  nodes: Node[],
  edges: Edge[],
) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'LR',
    nodesep: 50,
    edgesep: 100,
    ranksep: 100,
  })

  edges.forEach(edge => g.setEdge(edge.source, edge.target))
  nodes.forEach((node) => {
    if (node.type === 'hook') {
      g.setNode(node.id, {
        ...node,
        width: node.measured?.width ?? 0,
        height: node.measured?.height ?? 0,
        y: 500,
      })
    }
    else {
      g.setNode(node.id, {
        ...node,
        width: node.measured?.width ?? 0,
        height: node.measured?.height ?? 0,
      })
    }
  },
  )

  Dagre.layout(g)

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id)
      return { ...node, position: { x: position.x || 0, y: position.y || 0 } }
    }),
    edges,
  }
}

// 节点布局管理
function useFlowLayout() {
  const nodes = useNodes()
  const edges = useEdges()
  const { fitView, setNodes, setEdges } = useReactFlow()

  return {
    setLayout: useCallback(() => {
      const layout = layoutProcess(nodes, edges)
      setNodes(layout.nodes)
      setEdges(layout.edges)
      window.requestAnimationFrame(() => {
        fitView({ maxZoom: 0.8 })
      })
    }, [edges, nodes, setEdges, setNodes, fitView]),
  }
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
