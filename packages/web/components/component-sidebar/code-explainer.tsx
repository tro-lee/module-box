import type { LocalComponent } from '@module-toolbox/anaylzer'
import { explainCodeTasksAtom } from '@/lib/atoms/task'
import { useExplainCodeTask } from '@/lib/hooks/use-task'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Spinner } from '../ui/spinner'

export function ComponentCodeExplainer({ component }: { component: LocalComponent }) {
  const explainCodeTasks = useAtomValue(explainCodeTasksAtom)
  const { addTask, startTask } = useExplainCodeTask()

  const currentTask = explainCodeTasks[component.componentKey]

  useEffect(() => {
    if (!currentTask) {
      const task = addTask(component)
      startTask(task)
    }
  }, [component])

  if (!currentTask || currentTask?.type !== 'explainCodeTask')
    return

  if (currentTask?.status === 'pending') {
    return (
      <div className="flex items-center justify-end w-full">
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-96 max-h-[90vh] overflow-auto rounded-lg border bg-sidebar prose prose-sm dark:prose-invert p-4">
      <ReactMarkdown children={currentTask?.message} />
    </div>
  )
}
