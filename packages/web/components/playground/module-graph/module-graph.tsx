"use client";
"use module";

import React, { use, useCallback, useMemo } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { Button } from "../../ui/button";
import { CustomNodeType } from "./custom-node";
import { Module, Component } from "module-toolbox-library";

const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    animated: true,
    sourceHandle: "fuck",
  },
  { id: "e3-4", source: "3", target: "2", type: "custom" },
] as Edge[];

export function ModuleGraphSkeleton() {
  return <div>Loading...</div>;
}

export default function ModuleGraphComponent({
  promise,
}: {
  promise: Promise<{
    modules: Record<string, Module>;
    components: Record<string, Component>;
  }>;
}) {
  const { modules, components } = use(promise);

  // 获取所有节点
  // 不同类型节点，数据结构不一样
  const initialNodes = useMemo(() => {
    const moduleNodes = Object.values(modules).map((module) => ({
      id: module.componentKey,
      position: { x: 0, y: 0 },
      data: { label: module.componentName },
    }));

    const componentNodes = Object.values(components).map((component) => ({
      id: component.componentKey,
      position: { x: 0, y: 0 },
      data: { label: component.componentName },
    }));

    return [...moduleNodes, ...componentNodes];
  }, [modules, components]);

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
