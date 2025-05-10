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
    const currentTask = useTaskManagerStore(state => state.currentTask)

    useEffect(() => {
      transformToExplainCodeTask(component)
    }, [component])

    useEffect(() => {
      if (currentTask?.content) {
        remark()
          .use(html)
          .process(currentTask.content)
          .then((html) => {
            setHtmlContent(html.toString())
          })
      }
    }, [currentTask?.content])

    if (!htmlContent) {
      return (
        <div className="animate-pulse flex flex-col gap-2 items-center">
          <p className="text-sm text-gray-500">
            正在上传
            {component.componentName}
            代码...
          </p>
          <div className="h-2 w-32 bg-gray-200 rounded"></div>
        </div>
      )
    }

    return (
      <ScrollArea className="h-96 w-full relative rounded-lg" type="always">
        <div className="prose prose-sm dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </ScrollArea>
    )
  }
  else {
    return (<></>)
  }
}
