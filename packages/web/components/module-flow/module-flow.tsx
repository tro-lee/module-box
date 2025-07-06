'use client'
'use module'

import type { Component } from '@module-toolbox/anaylzer'
import type { Edge, EdgeChange, Node, NodeChange } from '@xyflow/react'
import Dagre from '@dagrejs/dagre'
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdges,
  useNodes,
  useNodesInitialized,
  useReactFlow,
} from '@xyflow/react'
import { useAtom, useSetAtom } from 'jotai'
import React, { use, useCallback, useEffect } from 'react'
import { moduleFlowEdgesAtom, moduleFlowNodesAtom, selectedComponentAtom } from '../../lib/atoms/module-flow'
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

function CoreFlow() {
  const [nodes, setNodes] = useAtom(moduleFlowNodesAtom)
  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => setNodes(draft => applyNodeChanges(changes, draft)),
    [setNodes],
  )
  const [edges, setEdges] = useAtom(moduleFlowEdgesAtom)
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => setEdges(draft => applyEdgeChanges(changes, draft)),
    [setEdges],
  )

  const setSelectedComponent = useSetAtom(selectedComponentAtom)

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
      onSelectionChange={({ nodes }) => setSelectedComponent(nodes[0]?.data?.component as Component | undefined)}
      fitView
      nodeTypes={CustomNodeType}
    >
      <Background variant={BackgroundVariant.Cross} gap={50} />
    </ReactFlow>
  )
}

export function ModuleFlow({ promise }: { promise: Promise<{ nodes: Node[], edges: Edge[] }> }) {
  const setNodes = useSetAtom(moduleFlowNodesAtom)
  const setEdges = useSetAtom(moduleFlowEdgesAtom)
  const data = use(promise)

  useEffect(() => {
    setNodes(data.nodes)
    setEdges(data.edges)
  }, [data])

  return (
    <div className="relative flex-1 flex justify-center items-center">
      <ReactFlowProvider>
        <CoreFlow />
      </ReactFlowProvider>
    </div>
  )
}
