'use client'

import { useGraphStore } from '@/store/graph-store'
import { HighlightCode } from '../common/highlight-code'
import { Card, CardContent } from '../ui/card'

export function DetailCardComponent() {
  const currentNode = useGraphStore(state => state.selectedNodes)

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
