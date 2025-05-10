import type { LocalComponent } from '@module-toolbox/anaylzer'
import { getExplainCodeStream } from '@/actions/explain-code-data'
import { create } from 'zustand'

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ExplainCodeTask {
  type: 'explainCodeTask'
  id: string
  componentKey: string
  componentFilePath: string
  locStart: number
  locEnd: number
  status: TaskStatus
  content?: string
  error?: string
  createdAt: Date
}

interface TaskManagerState {
  explainCodeTasks: ExplainCodeTask[]
  currentTask?: ExplainCodeTask
}

interface TaskManagerActions {
  transformToExplainCodeTask: (component: LocalComponent) => Promise<ExplainCodeTask>
  updatedTask: (task: ExplainCodeTask) => void
}

type TaskManagerStore = TaskManagerState & TaskManagerActions

export const useTaskManagerStore = create<TaskManagerStore>((set, get) => {
  console.log('kkk')
  return {
    explainCodeTasks: [],
    transformToExplainCodeTask: async (component: LocalComponent) => {
      const { componentKey, componentFilePath, locStart, locEnd } = component
      let task = get().explainCodeTasks.find(task => task.componentKey === componentKey)
      if (!task) {
        task = {
          type: 'explainCodeTask',
          id: componentKey,
          componentKey,
          componentFilePath,
          locStart,
          locEnd,
          status: 'pending',
          createdAt: new Date(),
        } as ExplainCodeTask

        set(state => ({
          explainCodeTasks: [...state.explainCodeTasks, task!],
          currentTask: task,
        }))
      }

      return task
    },
    updatedTask(task: ExplainCodeTask) {
      set((state) => {
        const index = state.explainCodeTasks.findIndex(t => t.id === task.id)
        if (index !== -1) {
          const updatedTasks = [...state.explainCodeTasks]
          updatedTasks[index] = task
          return { currentTask: task }
        }
        return state
      })
    },
  }
})

useTaskManagerStore.subscribe((state) => {
  const pendingTasks = state.explainCodeTasks.filter(task => task.status === 'pending')

  for (const task of pendingTasks) {
    // 处理流逻辑
    getExplainCodeStream(task.componentFilePath, task.locStart, task.locEnd)
      .then((stream) => {
        state.updatedTask({
          ...task,
          status: 'processing',
        })

        async function processStream(stream: ReadableStream<Uint8Array>) {
          const reader = stream.getReader()

          try {
            while (true) {
              const { done, value } = await reader.read()

              if (done) {
                state.updatedTask({
                  ...task,
                  status: 'completed',
                })
                break
              }

              const decoder = new TextDecoder()
              const text = decoder.decode(value, { stream: true })

              task.content = (task.content || '') + text
              state.updatedTask({
                ...task,
              })
            }
          }
          catch (error) {
            console.error('处理流时出错:', error)
            state.updatedTask({
              ...task,
              status: 'failed',
              error: error instanceof Error ? error.message : String(error),
            })
          }
          finally {
            reader.releaseLock()
          }
        }

        processStream(stream)
        console.log('开始处理任务:', task)
      })
  }
})
