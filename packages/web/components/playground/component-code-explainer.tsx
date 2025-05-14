'use client'
import type { Component } from '@module-toolbox/anaylzer'
import { useTaskManagerStore } from '@/store/task-manager-store'
import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { ScrollArea } from '../ui/scroll-area'

export function ComponentCodeExplainer({ component }: { component: Component }) {
  if (component.type === 'LocalComponent') {
    const transformToExplainCodeTask = useTaskManagerStore(state => state.transformToExplainCodeTask)
    const setCurrentTask = useTaskManagerStore(state => state.setCurrentTask)
    const currentTask = useTaskManagerStore(state => state.currentTask)

    useEffect(() => {
      transformToExplainCodeTask(component)
      setCurrentTask(component.componentKey)
    }, [component])

    if (currentTask?.status === 'pending') {
      return (
        <div className="animate-pulse flex flex-col gap-2 items-center p-4">
          <p className="text-sm text-gray-500">
            {currentTask?.content}
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
