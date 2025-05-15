import type { InitSolutionTask } from '@/lib/types'
import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { getInitSolutionStream } from '../actions/init-solution'
import { initSolutionTasksAtom } from '../atoms/task'
import { handleSSE } from '../utils'

export function useInitSolutionTask() {
  const setInitSolutionTask = useSetAtom(initSolutionTasksAtom)

  const createTask = useCallback((id: string, imageBase64: string) => {
    const task = {
      type: 'initSolutionTask',
      id,
      imageBase64,
      recognize: '',
      summary: '',
    } as InitSolutionTask

    return task
  }, [])

  const startTask = useCallback(async (task: InitSolutionTask) => {
    setInitSolutionTask((prev) => {
      prev[task.id].status = 'processing'
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
  }, [])

  return {
    createTask,
    startTask,
  }
}
