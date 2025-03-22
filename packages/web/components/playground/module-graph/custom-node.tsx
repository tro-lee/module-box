"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNodeContextStore } from "@/store/node-context-store";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { Component, Module } from "module-toolbox-library";
import { Fragment, memo, useCallback } from "react";

// 图表 模块节点
function GraphModuleNode({
  data,
  selected,
}: NodeProps<Node> & {
  data: { module: Module };
}) {
  const { module } = data;

  return (
    <Fragment>
      <Handle type="target" position={Position.Left} />
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          selected
            ? "ring-2 ring-primary shadow-lg scale-105"
            : "hover:shadow-md"
        }`}
      >
        <CardHeader>
          <CardTitle>{module.componentName}</CardTitle>
          <CardDescription>
            {module.componentFilePath.split("/").slice(-3).join("/")}
          </CardDescription>
        </CardHeader>
      </Card>
      <Handle type="source" position={Position.Right} />
    </Fragment>
  );
}

// 图表 组件节点
function GraphComponentNode({
  data,
}: NodeProps<Node> & {
  data: { component: Component };
}) {
  const { component } = data;
  const setCurrentNode = useNodeContextStore((state) => state.setCurrentNode);

  const handleClick = useCallback(() => {
    setCurrentNode(component);
  }, [component, setCurrentNode]);

  return (
    <Fragment>
      <Handle type="target" position={Position.Left} />
      <button
        className="flex flex-col bg-white border-2 border-gray-300 rounded-xl p-2 cursor-pointer hover:bg-gray-50"
        onClick={handleClick}
      >
        <h3>{component.componentName}</h3>
      </button>
      <Handle type="source" position={Position.Right} />
    </Fragment>
  );
}

export const CustomNodeType = {
  module: memo(GraphModuleNode),
  component: memo(GraphComponentNode),
};
