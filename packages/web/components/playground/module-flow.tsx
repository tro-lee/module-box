'use client'
'use module'

import type { Edge, Node } from '@xyflow/react'
import getModuleFlowData from '@/actions/module-flow-data'
import { usePlaygroundStore } from '@/stores/page/playground-store'
import Dagre from '@dagrejs/dagre'
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdges,
  useEdgesState,
  useNodes,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { useParams } from 'next/navigation'
import React, { memo, Suspense, use, useCallback, useEffect } from 'react'
import { Spinner } from '../ui/spinner'
import { CustomNodeType } from './module-flow-node'
import '@xyflow/react/dist/style.css'

// 节点布局管理
function useFlowLayout() {
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

  const nodes = useNodes()
  const edges = useEdges()
  const { fitView, setNodes, setEdges } = useReactFlow()

  return {
    setLayout: useCallback(() => {
      const layout = layoutProcess(nodes, edges)
      setNodes(layout.nodes)
      setEdges(layout.edges)
      window.requestAnimationFrame(() => {
        fitView({ maxZoom: 2 })
      })
    }, [edges, nodes, setEdges, setNodes, fitView]),
  }
}

// 核心流程图部分
function CoreFlow({ promise }: { promise: Promise<{ nodes: Node[], edges: Edge[] }> }) {
  const initialData = use(promise)
  const [nodes, , onNodesChange] = useNodesState(initialData.nodes)
  const [edges, , onEdgesChange] = useEdgesState(initialData.edges)

  // 布局
  const { setLayout } = useFlowLayout()
  const isNodesInitialized = useNodesInitialized()
  useEffect(() => {
    if (isNodesInitialized) {
      setLayout()
    }
  }, [isNodesInitialized])

  const onSelectionChange = useCallback(({ nodes }) => {
    usePlaygroundStore.setState((state) => {
      state.currentSelectedComponent = nodes[0]?.data?.component
    })
  }, [])

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
export const ModuleFlow = memo(() => {
  const params = useParams<{ encodepath: string }>()
  const path = decodeURIComponent(params.encodepath || '')
  const promise = getModuleFlowData(path)

  return (
    <div className="relative flex-1 flex justify-center items-center">
      <Suspense fallback={(
        <div className="flex flex-col justify-center items-center text-muted-foreground">
          <Spinner variant="bars" className="w-8 h-8 -translate-y-1/2" />
          <p>
            正在解析
            {' '}
            {path.split('/').slice(-1)}
          </p>
        </div>
      )}
      >
        <ReactFlowProvider>
          <CoreFlow promise={promise} />
        </ReactFlowProvider>
      </Suspense>
    </div>
  )
})
