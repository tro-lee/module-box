"use client";

import { useNodeContextStore } from "@/store/node-context-store";
import { Handle, Node, NodeProps, Position } from "@xyflow/react";
import { Component, Module } from "module-toolbox-library";
import { Fragment, memo, useCallback } from "react";

// 图表 模块节点
function GraphModuleNode({
  data,
}: NodeProps<Node> & {
  data: { module: Module };
}) {
  const { module } = data;

  const setCurrentNode = useNodeContextStore((state) => state.setCurrentNode);

  const handleClick = useCallback(() => {
    setCurrentNode(module);
  }, [module, setCurrentNode]);

  return (
    <Fragment>
      <Handle type="target" position={Position.Left} />
      <button
        className="flex flex-col bg-white border-2 border-gray-300 rounded-xl p-2 cursor-pointer hover:bg-gray-50"
        onClick={handleClick}
      >
        <h3>{module.componentName}</h3>
      </button>
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
