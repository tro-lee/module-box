'use client'

import type { Node, NodeProps } from '@xyflow/react'
import type { Component, Module } from 'module-toolbox-library'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Handle, Position, useNodeConnections } from '@xyflow/react'
import { Fragment, memo } from 'react'

// 图表 模块节点
function GraphModuleNode({
  data,
  selected,
  width,
  height,
  id,
}: NodeProps<Node> & {
  data: { module: Module }
}) {
  const { module } = data
  const connections = useNodeConnections()
  const hasTargetConnections = connections.some(c => c.target === module.key)
  const hasSourceConnections = connections.some(c => c.source === module.key)

  const handleDoubleClick = () => {
    // 构建 VSCode 或 Cursor 的 URL scheme
    const cursorUrl = `cursor://file/${module.componentFilePath}`

    // 尝试打开 Cursor
    window.location.href = cursorUrl
  }

  return (
    <Fragment>
      <Card
        className={`bg-primary-foreground cursor-pointer transition-all duration-200 ${
          selected
            ? 'ring-2 ring-primary shadow-lg scale-105'
            : 'hover:shadow-md'
        }`}
        onClick={handleDoubleClick}
      >
        {hasTargetConnections && <Handle type="target" position={Position.Left} />}
        {hasSourceConnections && <Handle type="source" position={Position.Right} />}
        <CardHeader>
          <CardTitle className="text-primary">{module.componentName}</CardTitle>
          <CardDescription>
            {height}
            {' '}
            |
            {' '}
            {width}
          </CardDescription>
        </CardHeader>
      </Card>
    </Fragment>
  )
}

// 图表 组件节点
function GraphComponentNode({
  data,
  selected,
}: NodeProps<Node> & {
  data: { component: Component }
}) {
  const { component } = data

  const connections = useNodeConnections()
  const hasTargetConnections = connections.some(c => c.target === component.componentKey)
  const hasSourceConnections = connections.some(c => c.source === component.componentKey)

  const Content = () => {
    if (component.type === 'LocalComponent') {
      return (
        <CardHeader>
          <CardTitle>{component.componentName}</CardTitle>
          <CardDescription>
            {component.componentFilePath.split('/').slice(-3).join('/')}
          </CardDescription>
        </CardHeader>
      )
    }

    if (component.type === 'NodeComponent') {
      return (
        <CardHeader>
          <CardTitle>{component.componentName}</CardTitle>
          <CardDescription>
            {component.packageName}
          </CardDescription>
        </CardHeader>
      )
    }
  }

  return (
    <Fragment>
      <Card className={`cursor-pointer transition-all duration-200 ${
        selected
          ? 'ring-2 ring-primary shadow-lg scale-105'
          : 'hover:shadow-md'
      }`}
      >
        {hasTargetConnections && <Handle type="target" position={Position.Left} />}
        <Content />
        {hasSourceConnections && <Handle type="source" position={Position.Right} />}
      </Card>
    </Fragment>
  )
}

export const CustomNodeType = {
  module: memo(GraphModuleNode),
  component: memo(GraphComponentNode),
}
