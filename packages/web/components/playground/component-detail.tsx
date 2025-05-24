'use client'
'use module'

import type { LocalComponent } from '@module-toolbox/anaylzer'
import { CodeBlock } from '@/components/ui/code-block'
import { Toggle } from '@/components/ui/toggle'
import { querySourceCode } from '@/lib/actions/query-source-code'
import { explainCodeTasksAtom } from '@/lib/atoms/task'
import { useExplainCodeTask } from '@/lib/hooks/use-task'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { Code, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { selectedComponentAtom } from '../../lib/atoms/playground'
import { Spinner } from '../ui/spinner'

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
  const [currentTab, setCurrentTab] = useState<'code' | 'explain'>('code')

  if (!selectedComponent || selectedComponent.type !== 'LocalComponent') {
    return <></>
  }

  return (
    <div className="flex flex-col justify-end items-end gap-2 p-2">
      <Toggle
        variant="outline"
        pressed={currentTab === 'explain'}
        onPressedChange={(pressed) => {
          setCurrentTab(pressed ? 'explain' : 'code')
        }}
        className="size-8 group bg-sidebar data-[state=on]:bg-sidebar data-[state=on]:hover:bg-muted"
      >
        <Code
          className="size-4 shrink-0 scale-0 opacity-0 transition-all group-data-[state=on]:scale-100 group-data-[state=on]:opacity-100"
        />
        <FileText
          className="size-4 absolute shrink-0 scale-100 opacity-100 transition-all group-data-[state=on]:scale-0 group-data-[state=on]:opacity-0"
        />
      </Toggle>

      <AnimatePresence mode="sync">
        {
          currentTab === 'code'
            ? (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ComponentCodeBlock component={selectedComponent} />
                </motion.div>
              )
            : (
                <motion.div
                  key="explain"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ComponentCodeExplainer component={selectedComponent} />
                </motion.div>
              )
        }
      </AnimatePresence>
    </div>
  )
}
