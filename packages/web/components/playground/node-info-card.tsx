'use client'

import { useNodeContextStore } from '@/store/node-context-store'

export function NodeInfoCardComponent() {
  const currentNode = useNodeContextStore(state => state.selectedNodes)

  if (!currentNode) {
    return null
  }

  return <div>{JSON.stringify(currentNode)}</div>
}
