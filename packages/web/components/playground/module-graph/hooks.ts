import { use, useCallback, useEffect, useMemo } from "react";
import Dagre from "@dagrejs/dagre";
import { Node, Edge, useNodesInitialized, useReactFlow } from "@xyflow/react";
import { Module, Component } from "module-toolbox-library";

// 获取初始节点和边数据
export function useInitialGraphData(
  promise: Promise<{
    modules: Record<string, Module>;
    components: Record<string, Component>;
  }>
) {
  const { modules, components } = use(promise);

  const { nodes, edges } = useMemo(() => {
    // 处理节点部分
    const nodes: Node[] = [];

    Object.values(modules).forEach((module) => {
      nodes.push({
        id: module.key,
        position: { x: 0, y: 0 },
        data: { module },
        type: "module",
      });
    });
    Object.values(components).forEach((component) => {
      nodes.push({
        id: component.componentKey,
        position: { x: 0, y: 0 },
        data: { component },
        type: "component",
      });
    });

    // 处理边部分
    const edges: Edge[] = [];

    Object.values(modules).forEach((module) => {
      edges.push({
        id: `edge-${module.key}-${module.componentKey}`,
        source: module.key,
        target: module.componentKey,
        animated: true,
      });
    });
    Object.values(components).forEach((component) => {
      if (component.type === "LocalComponent") {
        for (const jsxElement of component.componentJSXElements) {
          edges.push({
            id: `edge-${component.componentKey}-${jsxElement.componentKey}`,
            source: component.componentKey,
            target: jsxElement.componentKey,
          });
        }
      }
    });

    return { nodes, edges };
  }, [modules, components]);

  return {
    initialNodes: nodes,
    initialEdges: edges,
  };
}

// 布局处理
function layoutProcess(
  nodes: Node[],
  edges: Edge[],
  options: { direction: "TB" | "LR" }
) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: options.direction,
    nodesep: 10,
    edgesep: 100,
    ranksep: 100,
  });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    })
  );

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      return { ...node, position: { x: position.x || 0, y: position.y || 0 } };
    }),
    edges,
  };
}

// 节点布局管理
export function useFlowLayoutManager({
  nodes,
  edges,
  setNodes,
  setEdges,
}: {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}) {
  const { fitView } = useReactFlow();
  const onLayout = useCallback(() => {
    const layout = layoutProcess(nodes, edges, { direction: "LR" });
    setNodes(layout.nodes);
    setEdges(layout.edges);

    // 保证节点布局完成后，再进行视角调整
    window.requestAnimationFrame(() => {
      fitView({ duration: 1000, maxZoom: 0.8 });
    });
  }, [edges, nodes, setEdges, setNodes, fitView]);

  // 节点初始化完成后，进行布局
  const isNodesInitialized = useNodesInitialized();
  useEffect(() => {
    if (isNodesInitialized) {
      onLayout();
    }
  }, [isNodesInitialized]);

  return {
    onLayout,
  };
}
