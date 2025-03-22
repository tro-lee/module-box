"use client";

import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { Component, Module } from "module-toolbox-library";
import { Fragment } from "react";

// 图表 模块节点
function GraphModuleNode({
  data,
}: NodeProps<Node> & {
  data: { module: Module };
}) {
  const { module } = data;

  return (
    <Fragment>
      <Handle type="target" position={Position.Left} />
      <div className="flex flex-col bg-white border-2 border-gray-300 rounded-xl p-2">
        <h3>{module.componentName}</h3>
      </div>
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

  return (
    <Fragment>
      <Handle type="target" position={Position.Left} />
      <div className="flex flex-col bg-white border-2 border-gray-300 rounded-xl p-2">
        <h3>{component.componentName}</h3>
      </div>
      <Handle type="source" position={Position.Right} />
    </Fragment>
  );
}

export const CustomNodeType = {
  module: GraphModuleNode,
  component: GraphComponentNode,
};
