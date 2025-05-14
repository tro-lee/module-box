'use client'

import { useSolutionManagerStore } from '@/store/solution-manager-store'
import { useParams } from 'next/navigation'
import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Button } from '../ui/button'

function RecognizedText({ text }: { text: string }) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          <ReactMarkdown children={text} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function Markdown({ content }: { content: string }) {
  const components = useMemo(() => ({
    button: (btn: any) => {
      return (
        <Button>{btn.children}</Button>
      )
    },
    recognize: (data: any) => {
      return (
        <RecognizedText text={data.children} />
      )
    },
  }), [])

  return (
    <ReactMarkdown
      children={content}
      components={components}
      rehypePlugins={[rehypeRaw]}
    />
  )
}

export function TaskList() {
  // // 添加方案任务相关
  // const updateSolution = useSolutionManagerStore(state => state.updateSolution)
  // const addSolutionTask = useSolutionManagerStore(state => state.addSolutionTask)

  // const handleButtonClick = () => {
  //   const params = new URLSearchParams(window.location.search)
  //   const id = params.get('id')

  //   if (typeof cropperRef.current?.cropper !== 'undefined' && id) {
  //     const croppedBase64 = cropperRef.current?.cropper.getCroppedCanvas().toDataURL()
  //     updateSolution({ id: id! })
  //     addSolutionTask(id, croppedBase64)
  //   }
  // }
  const params = useParams()
  const currentSolution = useSolutionManagerStore(state => state.currentSolution)

  return (
    <div className="flex flex-col flex-1">
      {currentSolution?.id}
      <Markdown content="##
      <recognize> hi </recognize>"
      />
      {currentSolution?.detail.map(task => (
        <div key={task.id} className="flex items-center gap-2">
          <p>{task.status}</p>
          <img src={task.imgData} alt="Task" className="w-16 h-16" />
        </div>
      ))}

      {currentSolution?.detail.length === 0 && (
        <p className="text-sm text-muted-foreground">没有任务</p>
      )}
    </div>

  )
}
