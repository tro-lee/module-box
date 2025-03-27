'use client'

import { useNodeContextStore } from '@/store/node-context-store'
import { HighlightCode } from '../common/highlight-code'
import { Card, CardContent } from '../ui/card'

export function NodeInfoCardComponent() {
  const currentNode = useNodeContextStore(state => state.selectedNodes)

  if (!currentNode) {
    return null
  }

  return (
    <Card className="w-full h-full">
      <CardContent>
        <HighlightCode
          code={`
          `}
          language="typescript"
        />
      </CardContent>
    </Card>
  )
}
