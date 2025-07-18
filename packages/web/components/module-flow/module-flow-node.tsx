'use client'

import type { Component, Hook, Module } from '@module-toolbox/anaylzer'
import type { Node, NodeProps } from '@xyflow/react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Handle, Position, useNodeConnections } from '@xyflow/react'
import { NetworkIcon } from 'lucide-react'
import { Fragment, memo } from 'react'
import { Button } from '../ui/button'

// 图表 模块节点
function ModuleNode({
  data,
  selected,
}: NodeProps<Node> & {
  data: { module: Module }
}) {
  const { module } = data
  const connections = useNodeConnections()
  const hasSourceConnections = connections.some(c => c.source === module.moduleKey)

  // const handleDoubleClick = () => {
  //   // 构建 VSCode 或 Cursor 的 URL scheme
  //   // const cursorUrl = `cursor://file/${module.componentFilePath}`
  //   // 尝试打开 Cursor
  //   window.location.href = cursorUrl
  // }

  return (
    <Fragment>
      <Button variant="outline" size="icon" className="bg-muted shadow-none">
        <NetworkIcon />
      </Button>
      {hasSourceConnections && <Handle type="source" position={Position.Right} />}
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
      <Card className={cn('cursor-pointer transition-all duration-200 border-0 bg-muted shadow-none', selected
        ? 'ring-2 ring-muted-foreground'
        : 'hover:shadow-md')}
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
  else if (hook.type === 'NodeModuleHook') {
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
