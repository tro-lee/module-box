"use client";
import React, { Fragment, useCallback } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  BaseEdge,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  EdgeProps,
  getStraightPath,
  Handle,
  MiniMap,
  Node,
  NodeChange,
  NodeProps,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { Button } from "../ui/button";

const initialNodes = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "1" }, type: "input" },
  { id: "2", position: { x: 0, y: 100 }, data: { label: "2" }, type: "custom" },
  {
    id: "3",
    position: { x: 100, y: 200 },
    data: {
      label: (
        <li>
          <ul>3</ul>
        </li>
      ),
    },
  },
] as Node[];
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

function CustomNode({ data }: NodeProps<Node> & { data: { label: string } }) {
  return (
    <Fragment>
      <Handle type="target" position={Position.Top} />
      <div className="w-20 h-20 bg-red-500 rounded-full">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="fuck"
        className="left-2"
        style={{ left: "10px" }}
      />
      <Handle type="source" position={Position.Left} />
    </Fragment>
  );
}

function CustomEdge({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
    </>
  );
}

const edgeTypes = {
  custom: CustomEdge,
};

const nodeTypes = {
  custom: CustomNode,
};

export default function ModuleGraphComponent() {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const [edges, setEdges] = useEdgesState(initialEdges);
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
