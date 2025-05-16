'use client'

import type { Solution } from '../../lib/atoms/solution'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { initSolutionTasksAtom } from '@/lib/atoms/task'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useAtomValue } from 'jotai'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { solutionsAtom } from '../../lib/atoms/solution'
import { Card } from '../ui/card'
import { InitSolutionTaskCard } from './init-solution-task-card'

function ImageHoverCard({ imageBase64, children }: { imageBase64: string, children: React.ReactNode }) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="p-2">
        <img src={imageBase64} alt="" className="object-contain" />
      </HoverCardContent>
    </HoverCard>
  )
}

function SolutionItemList({ solution }: { solution: Solution }) {
  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
  }

  if (solution.items.length === 0) {
    return
  }

  return (
    <Card className="flex flex-col shadow-none">
      {solution.items.map((item, index) => (
        <div className={cn('flex flex-row justify-between p-4 h-16', index !== 0 && 'border-t')} key={item.id}>
          <div className="flex flex-col text-muted-foreground text-sm">
            <p>
              等待识别...
            </p>
            <p className="text-xs">
              {formatTime(item.createdAt)}
            </p>
          </div>
          <ImageHoverCard imageBase64={item.imageBase64}>
            <img
              src={item.imageBase64}
              alt=""
              className="h-full w-32 object-contain cursor-pointer"
            />
          </ImageHoverCard>
        </div>
      ))}
    </Card>
  )
}

export function SolutionDetail() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const solutions = useAtomValue(solutionsAtom)
  const currentSolution = solutions?.[params.id]

  const initSolutionTasks = useAtomValue(initSolutionTasksAtom)
  const currentTask = initSolutionTasks?.[params.id]

  useEffect(() => {
    if (!currentSolution) {
      router.push(`/create-solution/${uuidv4()}`)
    }
  }, [])

  if (!currentSolution || !currentTask) {
    return
  }

  return (
    <div className="flex flex-col gap-4 h-[92vh] overflow-auto">
      <InitSolutionTaskCard task={currentTask} />
      <SolutionItemList solution={currentSolution} />
    </div>
  )
}
