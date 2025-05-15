import type { LocalComponent } from '@module-toolbox/anaylzer'
import type { ExplainCodeTask } from '../types'
import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { getExplainCodeStream } from '../actions/explain-code'
import { explainCodeTasksAtom } from '../atoms/task'
import { handleStream } from '../utils'

export function useExplainCodeTask() {
  const setExplainCodeTasks = useSetAtom(explainCodeTasksAtom)

  const addTask = useCallback((component: LocalComponent) => {
    const newTask: ExplainCodeTask = {
      type: 'explainCodeTask',
      id: component.componentKey,
      component,
      status: 'pending',
      content: '',
      createdAt: new Date(),
    }
    setExplainCodeTasks((state) => {
      state[newTask.id] = newTask
    })
    return newTask
  }, [])

  const startTask = useCallback(async (task: ExplainCodeTask) => {
    const stream = await getExplainCodeStream(task.component.componentFilePath, task.component.locStart, task.component.locEnd)
    setExplainCodeTasks((prev) => {
      prev[task.id].status = 'processing'
    })

    handleStream(stream, {
      onMessage: (message) => {
        setExplainCodeTasks((state) => {
          state[task.id].content += message
        })
      },
      onFinish: () => {
        setExplainCodeTasks((state) => {
          state[task.id].status = 'completed'
        })
      },
    })
  }, [])

  return {
    addTask,
    startTask,
  }
}
