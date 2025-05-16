'use client'

import { initSolutionTasksAtom } from '@/lib/atoms/task'
import { useAtomValue } from 'jotai'
import { useParams } from 'next/navigation'
import React from 'react'
import { solutionsAtom } from '../../lib/atoms/solution'
import { SidebarTrigger } from '../ui/sidebar'
import { InitSolutionTaskCard } from './init-solution-task-card'

export function SolutionDetail() {
  const params = useParams<{ id: string }>()
  const solutions = useAtomValue(solutionsAtom)
  const currentSolution = solutions?.[params.id]

  const initSolutionTasks = useAtomValue(initSolutionTasksAtom)
  const currentTask = initSolutionTasks?.[params.id]

  return (
    <div className="flex flex-col flex-1 p-2 w-full">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <SidebarTrigger />
        <p className="text-sm">{currentSolution?.name}</p>
      </div>
      <InitSolutionTaskCard task={currentTask} />
    </div>

  )
}
