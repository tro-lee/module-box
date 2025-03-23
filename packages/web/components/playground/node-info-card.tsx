'use client'

import { useNodeContextStore } from '@/store/node-context-store'

export function NodeInfoCardComponent() {
  const currentNode = useNodeContextStore(state => state.currentNode)

  if (!currentNode) {
    return null
  }

  return <div>{currentNode.componentName}</div>
}
