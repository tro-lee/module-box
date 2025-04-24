'use client'

import { fetchCodeContentData } from '@/actions/code-content-data'
import { useGraphStore } from '@/store/graph-store'
import { TabsTrigger } from '@radix-ui/react-tabs'
import Prism from 'prismjs'
import { Suspense, use, useEffect, useState } from 'react'

import { Card } from '../ui/card'
import { Tabs, TabsContent, TabsList } from '../ui/tabs'
import 'prismjs/themes/prism.css'
import 'prismjs/components/prism-jsx.js'
import 'prismjs/components/prism-tsx.js'
import 'prismjs/plugins/line-numbers/prism-line-numbers.js'
import 'prismjs/plugins/line-numbers/prism-line-numbers.css'

function HighlightCode({ codeContentPromise }: { codeContentPromise: Promise<string> }) {
  const codeContent = use(codeContentPromise)

  useEffect(() => {
    Prism.highlightAll()
  }, [])

  return (
    <pre className="language-tsx line-numbers h-[80vh] overflow-auto rounded-lg" style={{ margin: 0 }}>
      <code>
        {codeContent}
      </code>
    </pre>
  )
}

export function DetailCardComponent() {
  const selectedComponents = useGraphStore(state => state.selectedComponents)
  const [selectedComponentKey, setSelectedComponentKey] = useState('')
  const [codeContentPromise, setCodeContentPromise] = useState<Promise<string>>(Promise.resolve(''))

  useEffect(() => {
    setSelectedComponentKey(selectedComponents[0]?.componentKey ?? '')
  }, [selectedComponents[0]?.componentKey])

  useEffect(() => {
    const selectedComponent = selectedComponents.find(node => node.componentKey === selectedComponentKey)
    if (selectedComponent?.type === 'LocalComponent') {
      const { componentFilePath, locStart, locEnd } = selectedComponent
      setCodeContentPromise(fetchCodeContentData(componentFilePath, locStart, locEnd))
    }
    else {
      setCodeContentPromise(Promise.resolve(''))
    }
  }, [selectedComponentKey, selectedComponents])

  if (selectedComponents.length === 0) {
    return null
  }

  return (
    <Tabs
      className="w-full h-full flex flex-col gap-2"
      key={selectedComponents[0].componentKey}
      value={selectedComponentKey}
    >
      <Card className="p-2">
        <TabsList key="tabsList" className="w-full overflow-auto">
          {selectedComponents.map((node, index) => (
            <TabsTrigger
              key={node.componentKey}
              value={node.componentKey}
              onClick={() =>
                setSelectedComponentKey(node.componentKey)}
            >
              {node.componentName}
            </TabsTrigger>
          ))}
        </TabsList>
      </Card>

      {selectedComponents.map((node, index) => (
        <TabsContent key={node.componentKey} value={node.componentKey}>
          <Suspense fallback={<div className="h-[80vh] w-full animate-pulse rounded-lg bg-[#f5f2f0]" />}>
            <HighlightCode codeContentPromise={codeContentPromise} />
          </Suspense>
        </TabsContent>
      ))}

      <Card className="flex-1">
      </Card>
    </Tabs>
  )
}
