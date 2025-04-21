'use client'

import type { Node, NodeProps } from '@xyflow/react'
import type { Component, Hook, Module } from 'module-toolbox-library'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Handle, Position, useNodeConnections } from '@xyflow/react'
import { Fragment, memo } from 'react'

// 图表 模块节点
function ModuleNode({
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
        className={`bg-muted text-muted-foreground cursor-pointer transition-all duration-200 ${
          selected
            ? 'ring-2 ring-primary shadow-lg scale-105'
            : 'hover:shadow-md'
        }`}
        onClick={handleDoubleClick}
      >
        {hasTargetConnections && <Handle type="target" position={Position.Left} />}
        {hasSourceConnections && <Handle type="source" position={Position.Right} />}
        <CardHeader>
          <CardTitle>{module.componentName}</CardTitle>
        </CardHeader>
      </Card>
    </Fragment>
  )
}

// 图表 组件节点
function ComponentNode({
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

// 图标 hook节点
function HookNode({
  data,
  selected,
}: NodeProps<Node> & {
  data: { hook: Hook }
}) {
  const { hook } = data

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <Card className="bg-muted text-muted-foreground">
        <Handle type="target" position={Position.Left} />
        {children}
      </Card>
    )
  }

  if (hook.type === 'LocalHook') {
    return (
      <Wrapper>
        <CardHeader>
          <CardTitle>{hook.hookName}</CardTitle>
        </CardHeader>
      </Wrapper>
    )
  }
  else if (hook.type === 'NodeHook') {
    return (
      <Wrapper>
        <CardHeader>
          <CardTitle>{hook.hookName}</CardTitle>
        </CardHeader>
      </Wrapper>
    )
  }
}

export const CustomNodeType = {
  module: memo(ModuleNode),
  component: memo(ComponentNode),
  hook: memo(HookNode),
}
