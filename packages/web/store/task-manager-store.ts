import type { LocalComponent } from '@module-toolbox/anaylzer'
import { getExplainCodeStream } from '@/actions/explain-code'
import { find } from 'lodash'
import { create } from 'zustand'

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ExplainCodeTask {
  type: 'explainCodeTask'
  id: string
  component: LocalComponent
  status: TaskStatus
  content?: string
  error?: string
  createdAt: Date
}

interface TaskManagerState {
  explainCodeTasks: Record<ExplainCodeTask['id'], ExplainCodeTask>
  currentTask?: ExplainCodeTask
}

interface TaskManagerActions {
  transformToExplainCodeTask: (component: LocalComponent) => Promise<ExplainCodeTask>
  updatedTask: (task: Partial<ExplainCodeTask> & Pick<ExplainCodeTask, 'id'>) => void
  setCurrentTask: (task: ExplainCodeTask['id']) => void
}

type TaskManagerStore = TaskManagerState & TaskManagerActions

export const useTaskManagerStore = create<TaskManagerStore>((set, get) => {
  return {
    explainCodeTasks: {},
    transformToExplainCodeTask: async (component: LocalComponent) => {
      const { componentKey, componentFilePath, locStart, locEnd } = component
      let task = find(get().explainCodeTasks, { id: component.componentKey })

      if (!task) {
        const newTask = {
          type: 'explainCodeTask',
          id: componentKey,
          component,
          status: 'pending',
          content: `${component.componentName}正在上传中`,
          createdAt: new Date(),
        } as ExplainCodeTask

        set(pre => ({
          explainCodeTasks: {
            ...pre.explainCodeTasks,
            [newTask.id]: newTask,
          },
        }))

        task = newTask

        // 处理流逻辑
        getExplainCodeStream(task.component.componentFilePath, task.component.locStart, task.component.locEnd)
          .then((stream) => {
            newTask.content = ''
            get().updatedTask({
              id: newTask.id,
              status: 'processing',
              content: '',
            })

            async function processStream(stream: ReadableStream<Uint8Array>) {
              const reader = stream.getReader()

              try {
                while (true) {
                  const { done, value } = await reader.read()

                  if (done) {
                    get().updatedTask({
                      id: newTask.id,
                      status: 'completed',
                    })
                    break
                  }

                  const decoder = new TextDecoder()
                  const text = decoder.decode(value, { stream: true })
                  newTask.content = (newTask.content || '') + text
                  get().updatedTask({
                    id: newTask.id,
                    content: newTask.content,
                  })
                }
              }
              catch (error) {
                console.error('处理流时出错:', error)

                // 处理错误
                newTask.status = 'failed'
                newTask.error = error instanceof Error ? error.message : String(error)
                get().updatedTask(newTask)
              }
              finally {
                reader.releaseLock()
              }
            }

            processStream(stream)
            console.log('开始处理任务:', task)
          })
      }

      return task
    },
    setCurrentTask(id: ExplainCodeTask['id']) {
      const task = find(get().explainCodeTasks, { id })
      set(() => ({
        currentTask: task,
      }))
    },
    updatedTask(task: Partial<ExplainCodeTask> & Pick<ExplainCodeTask, 'id'>) {
      set(pre => ({
        explainCodeTasks: {
          ...pre.explainCodeTasks,
          [task.id]: {
            ...pre.explainCodeTasks[task.id],
            ...task,
          },
        },
      }))

      if (get().currentTask?.id === task.id) {
        set(() => ({
          currentTask: {
            ...get().currentTask!,
            ...task,
          },
        }))
      }
    },
  }
})
