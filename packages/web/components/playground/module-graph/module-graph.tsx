"use client";
"use module";

import React, { use, useCallback, useMemo } from "react";
import Dagre from "@dagrejs/dagre";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Node,
  Edge,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { Button } from "../../ui/button";
import { CustomNodeType } from "./custom-node";
import { Module, Component } from "module-toolbox-library";

import "@xyflow/react/dist/style.css";

export function ModuleGraphSkeleton() {
  return <div>Loading...</div>;
}

// 布局处理
function layoutProcess(
  nodes: Node[],
  edges: Edge[],
  options: { direction: "TB" | "LR" }
) {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: options.direction });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 200,
      height: node.measured?.height ?? 50,
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

// 获取初始节点和边数据
function useInitialGraphData(
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
        data: { label: module.componentName },
      });
    });
    Object.values(components).forEach((component) => {
      nodes.push({
        id: component.componentKey,
        position: { x: 0, y: 0 },
        data: { label: component.componentName },
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

    const layout = layoutProcess(nodes, edges, {
      direction: "LR",
    });

    return { nodes: layout.nodes, edges: layout.edges };
  }, [modules, components]);

  return {
    initialNodes: nodes,
    initialEdges: edges,
  };
}

export default function ModuleGraphComponent({
  promise,
}: {
  promise: Promise<{
    modules: Record<string, Module>;
    components: Record<string, Component>;
  }>;
}) {
  const { initialNodes, initialEdges } = useInitialGraphData(promise);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={CustomNodeType}
      >
        <Controls />
        <Background variant={BackgroundVariant.Cross} gap={50} />
        <MiniMap />
        <Panel position="top-right">
          <Button variant="outline">Add Node</Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
