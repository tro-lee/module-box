'use client'
import type { Component } from '@module-toolbox/anaylzer'
import { useTaskManagerStore } from '@/store/task-manager-store'
import { useEffect, useState } from 'react'
import { remark } from 'remark'
import html from 'remark-html'
import { ScrollArea } from '../ui/scroll-area'

export function ComponentCodeExplainer({ component }: { component: Component }) {
  if (component.type === 'LocalComponent') {
    const [htmlContent, setHtmlContent] = useState<string>('')
    const transformToExplainCodeTask = useTaskManagerStore(state => state.transformToExplainCodeTask)
    const setCurrentTask = useTaskManagerStore(state => state.setCurrentTask)
    const currentTask = useTaskManagerStore(state => state.currentTask)

    useEffect(() => {
      transformToExplainCodeTask(component)
      setCurrentTask(component.componentKey)
    }, [component])

    useEffect(() => {
      const content = currentTask?.content
      if (content) {
        remark()
          .use(html)
          .process(content)
          .then((html) => {
            setHtmlContent(html.toString())
          })
      }
    }, [currentTask?.content])

    if (currentTask?.status === 'pending') {
      return (
        <div className="animate-pulse flex flex-col gap-2 items-center">
          <p className="text-sm text-gray-500">
            {currentTask?.content}
          </p>
          <div className="h-2 w-32 bg-gray-200 rounded"></div>
        </div>
      )
    }

    return (
      <ScrollArea className="h-[80vh] relative" type="scroll">
        <div className="prose prose-sm dark:prose-invert w-72 mr-2">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </ScrollArea>
    )
  }
  else {
    return (<></>)
  }
}
