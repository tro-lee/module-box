'use client'
'use module'

import { querySourceCode } from '@/actions/query-source-code'
import { useFlowStore } from '@/store/flow-store'
import Prism from 'prismjs'
import { use, useEffect, useState } from 'react'

import { Card } from '../ui/card'
import { Tabs } from '../ui/tabs'
import { ComponentCodeExplainer } from './component-code-explainer'
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

export function DetailCard() {
  const selectedComponents = useFlowStore(state => state.selectedComponents)
  const [selectedComponentKey, setSelectedComponentKey] = useState('')
  const [codeContentPromise, setCodeContentPromise] = useState<Promise<string>>(Promise.resolve(''))
  const [viewMode, setViewMode] = useState<'code' | 'explain'>('code')

  useEffect(() => {
    setSelectedComponentKey(selectedComponents[0]?.componentKey ?? '')
  }, [selectedComponents[0]?.componentKey])

  useEffect(() => {
    const selectedComponent = selectedComponents.find(node => node.componentKey === selectedComponentKey)
    if (selectedComponent?.type === 'LocalComponent') {
      const { componentFilePath, locStart, locEnd } = selectedComponent
      setCodeContentPromise(querySourceCode(componentFilePath, locStart, locEnd))
    }
    else {
      setCodeContentPromise(Promise.resolve(''))
    }
  }, [selectedComponentKey, selectedComponents])

  if (selectedComponents.length === 0) {
    return null
  }

  const selectedComponent = selectedComponents.find(node => node.componentKey === selectedComponentKey)

  return (
    <Tabs
      key={selectedComponents[0].componentKey}
      value={selectedComponentKey}
    >
      <Card className="flex flex-col">
        {selectedComponent && (
          // <TabsTrigger
          //   key={selectedComponent.componentKey}
          //   value={selectedComponent.componentKey}
          //   onClick={() =>
          //     setSelectedComponentKey(selectedComponent.componentKey)}
          // >
          <ComponentCodeExplainer component={selectedComponent} />
          // </TabsTrigger>
        )}
      </Card>
    </Tabs>
  )
}
