'use client'
'use module'

import type { LocalComponent } from '@module-toolbox/anaylzer'
import { usePlaygroundStore } from '@/stores/page/playground-store'
import { useTaskManagerStore } from '@/stores/task/task-manager-store'
import Prism from 'prismjs'
import { use, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useShallow } from 'zustand/shallow'
import { Card } from '../ui/card'

import { ScrollArea } from '../ui/scroll-area'
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

function ComponentCodeExplainer({ component }: { component: LocalComponent }) {
  if (component.type === 'LocalComponent') {
    const addExplainCodeTask = useTaskManagerStore(state => state.addExplainCodeTask)
    const currentTask = useTaskManagerStore(
      useShallow(state => state.explainCodeTasks[component.componentKey]),
    )

    useEffect(() => {
      addExplainCodeTask(component)
    }, [component])

    if (!currentTask || currentTask?.type !== 'explainCodeTask')
      return

    if (currentTask?.status === 'pending') {
      return (
        <div className="animate-pulse flex flex-col gap-2 items-center p-4">
          <p className="text-sm text-gray-500">
            {currentTask?.component.componentName}
            {' '}
            正在上传中
          </p>
          <div className="h-2 w-32 bg-gray-200 rounded"></div>
        </div>
      )
    }

    return (
      <ScrollArea className="h-[90vh]" type="scroll">
        <div className="prose prose-sm dark:prose-invert w-72 p-4">
          <ReactMarkdown children={currentTask?.content} />
        </div>
      </ScrollArea>
    )
  }
  else {
    return (<></>)
  }
}

export function ComponentDetail() {
  const selectedComponent = usePlaygroundStore(state => state.currentSelectedComponent)

  if (!selectedComponent || selectedComponent.type !== 'LocalComponent') {
    return <></>
  }

  return (
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
  )
}
