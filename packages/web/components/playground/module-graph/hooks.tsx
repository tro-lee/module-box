import type { Edge, Node } from '@xyflow/react'
import Dagre from '@dagrejs/dagre'
import { useEdges, useNodes, useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'

// 布局处理
function layoutProcess(
  nodes: Node[],
  edges: Edge[],
  options: { direction: 'TB' | 'LR' },
) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: options.direction,
    nodesep: 10,
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
export function useFlowLayout() {
  const nodes = useNodes()
  const edges = useEdges()
  const { fitView, setNodes, setEdges } = useReactFlow()

  return {
    setLayout: useCallback(() => {
      const layout = layoutProcess(nodes, edges, { direction: 'LR' })
      setNodes(layout.nodes)
      setEdges(layout.edges)
      window.requestAnimationFrame(() => {
        fitView({ maxZoom: 0.8 })
      })
    }, [edges, nodes, setEdges, setNodes, fitView]),
  }
}
