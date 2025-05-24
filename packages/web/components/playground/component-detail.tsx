'use client'
'use module'

import type { LocalComponent } from '@module-toolbox/anaylzer'
import { CodeBlock } from '@/components/ui/code-block'
import { querySourceCode } from '@/lib/actions/query-source-code'
import { explainCodeTasksAtom } from '@/lib/atoms/task'
import { useExplainCodeTask } from '@/lib/hooks/use-task'
import { useAtomValue } from 'jotai'
import { Code, FileText } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'

import ReactMarkdown from 'react-markdown'
import { selectedComponentAtom } from '../../lib/atoms/playground'
import { Spinner } from '../ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

function ComponentCodeBlock({ component }: { component: LocalComponent }) {
  const [code, setCode] = useState<string>('')

  useEffect(() => {
    querySourceCode(
      component.componentFilePath,
      component.locStart,
      component.locEnd,
    ).then((code) => {
      setCode(code)
    })
  }, [component])

  if (!code) {
    return (
      <div className="flex items-center justify-end w-full">
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-h-[90vh] w-96 overflow-auto rounded-lg border bg-sidebar">
      <CodeBlock
        language="tsx"
        filename={component.componentFilePath.split('/').pop() ?? ''}
        code={code}
      />
    </div>
  )
}

function ComponentCodeExplainer({ component }: { component: LocalComponent }) {
  const explainCodeTasks = useAtomValue(explainCodeTasksAtom)
  const { addTask, startTask } = useExplainCodeTask()

  const currentTask = explainCodeTasks[component.componentKey]

  useEffect(() => {
    if (!currentTask) {
      const task = addTask(component)
      startTask(task)
    }
  }, [component])

  if (!currentTask || currentTask?.type !== 'explainCodeTask')
    return

  if (currentTask?.status === 'pending') {
    return (
      <div className="flex items-center justify-end w-full">
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-96 max-h-[90vh] overflow-auto rounded-lg border bg-sidebar prose prose-sm dark:prose-invert p-4">
      <ReactMarkdown children={currentTask?.message} />
    </div>
  )
}

export function ComponentDetail() {
  const selectedComponent = useAtomValue(selectedComponentAtom)

  if (!selectedComponent || selectedComponent.type !== 'LocalComponent') {
    return <></>
  }

  return (
    <Tabs defaultValue="code" className="flex flex-col justify-end">
      <TabsList className="flex flex-row justify-end">
        <TabsTrigger value="code">
          <Code className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="explain">
          <FileText className="h-4 w-4" />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="code" className="mt-0">
        <Suspense fallback={<Spinner className="size-4" />}>
          <ComponentCodeBlock component={selectedComponent} />
        </Suspense>
      </TabsContent>
      <TabsContent value="explain" className="mt-0">
        <ComponentCodeExplainer component={selectedComponent} />
      </TabsContent>
    </Tabs>
  )
}
