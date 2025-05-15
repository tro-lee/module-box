'use client'
'use module'

import type { ExplainCodeTask, TaskStatus } from '@/lib/types'
import { explainCodeTasksAtom } from '@/lib/atoms/task'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useAtomValue } from 'jotai'
import { keys, values } from 'lodash'
import { Progress } from '../ui/progress'
import { ScrollArea } from '../ui/scroll-area'

function TaskItem({ task }: { task: ExplainCodeTask }) {
  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
  }

  const map = {
    pending: 0,
    processing: 50,
    completed: 100,
    failed: 0,
  } as Record<TaskStatus, number>

  const progressValue = map[task.status]

  return (
    <div className="flex flex-col mb-2">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          {task.component.componentName}
        </p>
        <Progress value={progressValue} className="w-12 text-muted-foreground" />
      </div>
      {task.error && (
        <p className="text-xs text-red-500 mt-1">{task.error}</p>
      )}

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

export function TaskExplorer() {
  const explainCodeTasks = useAtomValue(explainCodeTasksAtom)

  return (
    <ScrollArea className="p-2">
      {keys(explainCodeTasks).length === 0
        && (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">暂无任务</p>
          </div>
        )}
      {
        values(explainCodeTasks).map(task => (
          <TaskItem key={task.id} task={task} />
        ))
      }
    </ScrollArea>
  )
}
