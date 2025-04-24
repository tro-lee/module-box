'use client'

import { useGraphStore } from '@/store/graph-store'
import { TabsTrigger } from '@radix-ui/react-tabs'
import { HighlightCode } from '../common/highlight-code'
import { Card, CardContent } from '../ui/card'
import { Tabs, TabsContent, TabsList } from '../ui/tabs'

export function DetailCardComponent() {
  const selectedComponents = useGraphStore(state => state.selectedComponents)

  if (selectedComponents.length === 0) {
    return null
  }

  return (
    <Tabs
      className="w-full h-full flex flex-col gap-4"
      key={selectedComponents[0].componentKey}
      defaultValue={selectedComponents[0].componentKey}
    >
      <Card className="p-2">
        <TabsList key="tabsList" className="w-full overflow-auto">
          {selectedComponents.map((node, index) => (
            <TabsTrigger key={node.componentKey} value={node.componentKey}>
              {node.componentName}
            </TabsTrigger>
          ))}
        </TabsList>
      </Card>

      <Card className="flex-1">
        <CardContent>

          {selectedComponents.map((node, index) => (
            <TabsContent key={node.componentKey} value={node.componentKey}>
              <HighlightCode
                code={node.componentName}
                language="typescript"
              />
            </TabsContent>
          ))}
        </CardContent>
      </Card>
    </Tabs>
  )
}
