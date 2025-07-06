'use client'
'use module'

import type { ExplainCodeTask, Task, TaskStatus } from '@/lib/types'
import type { ReactElement } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
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

type TaskComponentMap = Record<
  Task['type'],
  (props: { task: any }) => ReactElement
>

const TaskItemMap: TaskComponentMap = {
  explainCodeTask: ExplainCodeTaskItem,
}

export function TaskItem({ task }: { task: Task }) {
  const TaskComponent = TaskItemMap[task.type]
  if (!TaskComponent) {
    return null
  }
  return <TaskComponent task={task} />
}
