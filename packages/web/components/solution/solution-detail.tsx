'use client'

import type { Solution } from '../../lib/atoms/solution'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { anaylzeSolutionItemTasksAtom, initSolutionTasksAtom } from '@/lib/atoms/task'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useAtomValue } from 'jotai'
import { values } from 'lodash'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { solutionsAtom } from '../../lib/atoms/solution'
import { Spinner } from '../ui/spinner'
import { InitSolutionTaskCard } from './init-solution-task-card'

export function SolutionItem({ item }: { item: Solution['items'][number] }) {
  const anaylzeSolutionItemTasks = useAtomValue(anaylzeSolutionItemTasksAtom)
  const currentTask = anaylzeSolutionItemTasks?.[item.anaylzeSolutionItemTaskId]

  return (
    <div className="flex flex-col gap-1 w-full text-muted-foreground">
      <div className="h-16 border rounded-lg overflow-auto w-full">
        {
          currentTask.status === 'pending'
            ? (
                <HoverCard>
                  <HoverCardTrigger>
                    <img
                      src={currentTask.imageBase64}
                      alt=""
                      className="h-full w-full object-cover animate-pulse"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent className="p-2">
                    <img src={currentTask.imageBase64} alt="" className="object-contain" />
                  </HoverCardContent>
                </HoverCard>
              )
            : (
                <p className="text-sm m-2">{currentTask.result}</p>
              )
        }
      </div>

      <div className="flex flex-row justify-between text-xs">
        <p>
          分析#
          {item.id.slice(0, 6)}
        </p>
        <div className="flex flex-row items-center gap-2">
          <Spinner className={cn(['pending', 'processing'].includes(currentTask.status) ? 'size-4' : 'size-0')} />
          <p>
            {formatDistanceToNow(currentTask.createdAt, { addSuffix: true, locale: zhCN })}
          </p>
        </div>
      </div>
    </div>
  )
}

export function SolutionDetail() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const solutions = useAtomValue(solutionsAtom)
  const currentSolution = solutions?.[params.id]

  const initSolutionTasks = useAtomValue(initSolutionTasksAtom)
  const currentTask = initSolutionTasks?.[currentSolution?.initSolutionTaskId]

  useEffect(() => {
    if (!currentSolution) {
      router.push(`/create-solution/${uuidv4()}`)
    }
  }, [])

  if (!currentSolution || !currentTask) {
    return
  }

  return (
    <div className="flex flex-col gap-4 h-[92vh] overflow-auto pb-8">
      <InitSolutionTaskCard task={currentTask} />
      {values(currentSolution.items).map(item => (
        <SolutionItem item={item} key={item.id} />
      ))}
    </div>
  )
}
