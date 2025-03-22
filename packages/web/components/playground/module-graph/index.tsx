"use client";
"use module";

import React, { memo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  ReactFlowProvider,
  useOnSelectionChange,
} from "@xyflow/react";
import { CustomNodeType } from "./custom-node";
import { Module, Component } from "module-toolbox-library";

import "@xyflow/react/dist/style.css";
import { useFlowLayoutManager, useInitialGraphData } from "./hooks";

export function ModuleGraphSkeleton() {
  return <div>Loading...</div>;
}

// 核心流程图部分
function CoreFlow({
  promise,
}: {
  promise: Promise<{
    modules: Record<string, Module>;
    components: Record<string, Component>;
  }>;
}) {
  const { initialNodes, initialEdges } = useInitialGraphData(promise);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useFlowLayoutManager({ nodes, edges, setNodes, setEdges });

  useOnSelectionChange({
    onChange: (selection) => {
      console.log(selection);
    },
  });

  return (
    <ReactFlow
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
  );
}

// 包裹下，提供 ReactFlowProvider 上下文
export const ModuleGraphComponent = memo(function ModuleGraphComponent({
  promise,
}: {
  promise: Promise<{
    modules: Record<string, Module>;
    components: Record<string, Component>;
  }>;
}) {
  return (
    <ReactFlowProvider>
      <CoreFlow promise={promise} />
    </ReactFlowProvider>
  );
});

export default ModuleGraphComponent;
