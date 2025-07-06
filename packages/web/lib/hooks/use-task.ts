import type { BaseTask, ExplainCodeTask } from '@/lib/types'
import type { LocalComponent } from '@module-toolbox/anaylzer'
import type { Draft } from 'immer'
import type { atomWithImmer } from 'jotai-immer'
import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { startExplainCodeStream } from '../actions/explain-code'
import { explainCodeTasksAtom } from '../atoms/task'
import { handleStream } from '../utils'

function useStreamTask<T extends BaseTask>(
  taskAtom: ReturnType<typeof atomWithImmer<Record<string, T>>>,
  startTaskStream: (task: T) => Promise<ReadableStream<Uint8Array>>,
) {
  const setTask = useSetAtom(taskAtom)

  const addStreamTask = useCallback((task: Omit<T, keyof BaseTask> & { id: string, type: string }) => {
    const newTask = {
      status: 'pending',
      createdAt: new Date(),
      message: '',
      sse: {},
      error: undefined,
      ...task,
    } as T

    setTask((state) => {
      state[task.id] = newTask as Draft<T>
    })
    return newTask
  }, [])

  const startStreamTask = useCallback(async (
    task: T,
    handleStreamCallBack: Partial<Parameters<typeof handleStream>['1']> = {},
  ) => {
    const streamSSE = await startTaskStream(task)
    handleStream(streamSSE, {
      onStart: () => {
        handleStreamCallBack.onStart?.()
      },
      onEvent: (type, data) => {
        setTask((prev) => {
          if (!prev[task.id].sse[type]) {
            prev[task.id].sse[type] = ''
          }

          prev[task.id].sse[type] += data
        })
        handleStreamCallBack.onEvent?.(type, data)
      },
      onMessage: (message) => {
        setTask((prev) => {
          prev[task.id].status = 'processing'
          prev[task.id].message += message
        })
        handleStreamCallBack.onMessage?.(message)
      },
      onFinish: () => {
        setTask((prev) => {
          prev[task.id].status = 'completed'
        })
        handleStreamCallBack.onFinish?.()
      },
    })
  }, [setTask, startTaskStream])

  return {
    addStreamTask,
    startStreamTask,
  }
}

export function useExplainCodeTask() {
  const { addStreamTask, startStreamTask } = useStreamTask(
    explainCodeTasksAtom,
    startExplainCodeStream,
  )

  const addTask = useCallback((component: LocalComponent) => {
    return addStreamTask({
      type: 'explainCodeTask',
      id: component.componentKey,
      component,
    })
  }, [])

  const startTask = useCallback(async (task: ExplainCodeTask) => {
    startStreamTask(task)
  }, [startStreamTask])

  return {
    addTask,
    startTask,
  }
}
