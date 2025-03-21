"use client";

import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { Module } from "module-toolbox-library";
import { Fragment } from "react";

// 图表 模块节点
function GraphModuleNode({
  data,
}: NodeProps<Node> & { data: { module: Module } }) {
  const { module } = data;

  return (
    <Fragment>
      <Handle type="target" position={Position.Top} />
      <div className="flex flex-col items-center justify-center w-48 h-24 bg-white border-2 border-gray-300 rounded-full">
        <div className="font-medium text-gray-800">{module.componentName}</div>
        <div className="text-xs text-gray-500 truncate max-w-[90%]">
          {module.componentFilePath}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </Fragment>
  );
}

export const CustomNodeType = {
  module: GraphModuleNode,
};
