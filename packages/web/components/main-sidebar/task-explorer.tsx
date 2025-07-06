'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { explainCodeTasksAtom } from '@/lib/atoms/task'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { useAtomValue } from 'jotai'
import { keys, values } from 'lodash'
import { Command } from 'lucide-react'
import { TaskItem } from './task-explorer-item'

export function TaskExplorer() {
  const explainCodeTasks = useAtomValue(explainCodeTasksAtom)

  const hasTasks = keys(explainCodeTasks).length > 0

  // 定义任务类型配置
  const taskConfigs = [
    {
      id: 'explain-code-tasks',
      title: '代码解释',
      tasks: explainCodeTasks,
    },
  ]

  return (
    <ScrollArea className="p-2">
      {!hasTasks && (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">暂无任务</p>
        </div>
      )}

      {hasTasks && (
        <Accordion type="multiple" className="w-full text-muted-foreground" defaultValue={taskConfigs.map(({ id }) => id)}>
          {taskConfigs.map(({ id, title, tasks }) =>
            keys(tasks).length > 0 && (
              <AccordionItem key={id} value={id} className="mb-2">
                <AccordionTrigger>
                  <nav className="flex items-center gap-1">
                    <Command className="w-4 h-4" />
                    <p className="text-xs">
                      {title}
                    </p>
                  </nav>
                </AccordionTrigger>
                <AccordionContent>
                  {values(tasks).map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            ),
          )}
        </Accordion>
      )}
    </ScrollArea>
  )
}
