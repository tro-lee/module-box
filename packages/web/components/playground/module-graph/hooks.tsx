import type { Edge, Node } from '@xyflow/react'
import type { Component, Module } from 'module-toolbox-library'
import Dagre from '@dagrejs/dagre'
import { useEdges, useNodes, useReactFlow } from '@xyflow/react'
import { use, useCallback, useMemo } from 'react'

// 获取初始节点和边数据
export function useInitialGraphData(
  promise: Promise<{
    modules: Record<string, Module>
    components: Record<string, Component>
  }>,
) {
  const { modules, components } = use(promise)

  const { nodes, edges } = useMemo(() => {
    // 处理节点部分
    const nodes: Node[] = []

    Object.values(modules).forEach((module) => {
      nodes.push({
        id: module.key,
        position: { x: 0, y: 0 },
        data: { module, node: module, type: 'module' },
        type: 'module',
      })
    })
    Object.values(components).forEach((component) => {
      nodes.push({
        id: component.componentKey,
        position: { x: 0, y: 0 },
        data: { component, node: component, type: 'component' },
        type: 'component',
      })
    })

    // 处理边部分
    const edges: Edge[] = []

    Object.values(modules).forEach((module) => {
      edges.push({
        id: `edge-${module.key}-${module.componentKey}`,
        source: module.key,
        target: module.componentKey,
        animated: true,
      })
    })
    Object.values(components).forEach((component) => {
      if (component.type === 'LocalComponent') {
        for (const jsxElement of component.componentJSXElements) {
          edges.push({
            id: `edge-${component.componentKey}-${jsxElement.componentKey}`,
            source: component.componentKey,
            target: jsxElement.componentKey,
          })
        }
      }
    })

    return { nodes, edges }
  }, [modules, components])

  return {
    initialNodes: nodes,
    initialEdges: edges,
  }
}

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
  nodes.forEach(node =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    }),
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
