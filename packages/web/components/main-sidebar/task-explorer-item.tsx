'use client'
'use module'

import type { AnaylzeSolutionItemTask, ExplainCodeTask, InitSolutionTask, Task, TaskStatus } from '@/lib/types'
import type { ReactElement } from 'react'
import { solutionsAtom } from '@/lib/atoms/solution'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useAtomValue } from 'jotai'
import { Progress } from '../ui/progress'

const map = {
  pending: 0,
  processing: 50,
  completed: 100,
  failed: 0,
} as Record<TaskStatus, number>

function formatTime(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
}

function InitSolutionTaskItem({ task }: { task: InitSolutionTask }) {
  const progressValue = map[task.status]
  const solutions = useAtomValue(solutionsAtom)
  const solution = solutions?.[task.solutionId]

  return (
    <div className="flex flex-col mb-2">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          {solution.name}
        </p>
        <Progress value={progressValue} className="w-12 text-muted-foreground" />
      </div>
      <div className="text-xs text-muted-foreground flex items-center justify-between">
        <p>
          {task.summary.slice(0, 10)}
          ...
        </p>
        <p>
          {formatTime(task.createdAt)}
        </p>
      </div>
    </div>
  )
}

function ExplainCodeTaskItem({ task }: { task: ExplainCodeTask }) {
  const progressValue = map[task.status]
  return (
    <div className="flex flex-col mb-2">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          {task.component.componentName}
        </p>
        <Progress value={progressValue} className="w-12 text-muted-foreground" />
      </div>
      <div className="text-xs text-muted-foreground flex items-center justify-between">
        <p>
          {task.component.componentFilePath.split('/').slice(-1).join('/')}
        </p>
        <p>
          {formatTime(task.createdAt)}
        </p>
      </div>
    </div>
  )
}

function AnaylzeSolutionItemTaskItem({ task }: { task: AnaylzeSolutionItemTask }) {
  const progressValue = map[task.status]
  return (
    <div className="flex flex-col mb-2">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          {`分析#${task.solutionItemId.substring(0, 6)}`}
        </p>
        <Progress value={progressValue} className="w-12 text-muted-foreground" />
      </div>
      <div className="text-xs text-muted-foreground flex items-center justify-between">
        <p>方案分析</p>
        <p>
          {formatTime(task.createdAt)}
        </p>
      </div>
    </div>
  )
}

type TaskComponentMap = Record<
  Task['type'],
  (props: { task: any }) => ReactElement
>

const TaskItemMap: TaskComponentMap = {
  anaylzeSolutionItemTask: AnaylzeSolutionItemTaskItem,
  initSolutionTask: InitSolutionTaskItem,
  explainCodeTask: ExplainCodeTaskItem,
}

export function TaskItem({ task }: { task: Task }) {
  const TaskComponent = TaskItemMap[task.type]
  if (!TaskComponent) {
    return null
  }
  return <TaskComponent task={task} />
}
