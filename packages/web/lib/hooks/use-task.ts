import type { AnaylzeSolutionItemTask, BaseTask, ExplainCodeTask, InitSolutionTask } from '@/lib/types'
import type { LocalComponent } from '@module-toolbox/anaylzer'
import type { Draft } from 'immer'
import type { atomWithImmer } from 'jotai-immer'
import type { Solution } from '../atoms/solution'
import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { startAnaylzeSolutionItemStream } from '../actions/anaylze-solution-item'
import { startExplainCodeStream } from '../actions/explain-code'
import { startInitSolutionTaskStream } from '../actions/init-solution'
import { solutionsAtom } from '../atoms/solution'
import { anaylzeSolutionItemTasksAtom, explainCodeTasksAtom, initSolutionTasksAtom } from '../atoms/task'
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

export function useInitSolutionTask() {
  const { addStreamTask, startStreamTask } = useStreamTask(
    initSolutionTasksAtom,
    startInitSolutionTaskStream,
  )

  const setInitSolutionTask = useSetAtom(initSolutionTasksAtom)

  const addTask = useCallback((id: string, imageBase64: string) => {
    return addStreamTask({
      type: 'initSolutionTask',
      id,
      imageBase64,
      solutionId: id,
      recognize: '',
      summary: '',
    })
  }, [addStreamTask])

  const startTask = useCallback(async (task: InitSolutionTask) => {
    startStreamTask(task, {
      onStart: () => {
      },
      onEvent: () => {
        setInitSolutionTask((prev) => {
          console.log('onEvent', prev[task.id].sse.recognize)
          prev[task.id].recognize = prev[task.id].sse.recognize || ''
          prev[task.id].summary = prev[task.id].sse.summary || ''
        })
      },
    })
  }, [])

  return {
    addTask,
    startTask,
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

export function useAnaylzeSolutionItemTask() {
  const setAnaylzeSolutionItemTask = useSetAtom(anaylzeSolutionItemTasksAtom)
  const setSolutions = useSetAtom(solutionsAtom)

  const { addStreamTask, startStreamTask } = useStreamTask(
    anaylzeSolutionItemTasksAtom,
    startAnaylzeSolutionItemStream,
  )

  const addTask = useCallback((solutionItem: Solution['items'][number]) => {
    const { id, solutionId, imageBase64 } = solutionItem
    setSolutions((draft) => {
      draft[solutionId].items[id].anaylzeSolutionItemTaskId = id
    })

    return addStreamTask({
      type: 'anaylzeSolutionItemTask',
      id,
      imageBase64,
      solutionId,
      solutionItemId: id,
      result: '',
    })
  }, [addStreamTask])

  const startTask = useCallback(async (task: AnaylzeSolutionItemTask) => {
    startStreamTask(task, {
      onMessage: () => {
        setAnaylzeSolutionItemTask((prev) => {
          prev[task.id].result = prev[task.id].message || ''
        })
      },
    })
  }, [startStreamTask])

  return {
    addTask,
    startTask,
  }
}
