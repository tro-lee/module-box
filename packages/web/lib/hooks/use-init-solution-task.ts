import type { InitSolutionTask } from '@/lib/types'
import { useSetAtom } from 'jotai'
import { random } from 'lodash'
import { useCallback } from 'react'
import { getInitSolutionStream } from '../actions/init-solution'
import { initSolutionTasksAtom } from '../atoms/task'
import { handleSSE } from '../utils'
import { useSolutionManager } from './use-solution-manager'

export function useInitSolutionTask() {
  const setInitSolutionTask = useSetAtom(initSolutionTasksAtom)
  const { addSolution } = useSolutionManager()

  const addTask = useCallback((id: string, imageBase64: string) => {
    const task = {
      type: 'initSolutionTask',
      id,
      imageBase64,
      recognize: '',
      summary: '',
    } as InitSolutionTask

    setInitSolutionTask((state) => {
      state[task.id] = task
    })
    return task
  }, [])

  const startTask = useCallback(async (task: InitSolutionTask) => {
    addSolution(task.id, {
      name: `新建方案#${random(1000, false)}`,
      id: task.id,
      imageBase64: task.imageBase64,
    })

    setInitSolutionTask((prev) => {
      prev[task.id].status = 'processing'
      prev[task.id].imageBase64 = task.imageBase64
    })

    const streamSSE = await getInitSolutionStream(task.imageBase64, task.id)
    handleSSE(streamSSE, {
      onEvent: (type, data) => {
        if (type === 'recognize' || type === 'summary') {
          setInitSolutionTask((prev) => {
            prev[task.id][type] += data
          })
        }
      },
      onFinish: () => {
        setInitSolutionTask((prev) => {
          prev[task.id].status = 'completed'
        })
      },
    })
  }, [setInitSolutionTask, addSolution])

  return {
    addTask,
    startTask,
  }
}
