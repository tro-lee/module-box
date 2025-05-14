import type { LocalComponent } from '@module-toolbox/anaylzer'
import { getExplainCodeStream } from '@/actions/explain-code'
import { handleStream } from '@/lib/utils'
import { find } from 'lodash'
import { create } from 'zustand'
import { useSolutionManagerStore } from './solution-manager-store'

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface BaseTask {
  type: string
  id: string
  status: TaskStatus
  error?: string
}

export type ExplainCodeTask = BaseTask & {
  type: 'explainCodeTask'
  content?: string
  component: LocalComponent
  createdAt: Date
}

export type InitSolutionTask = BaseTask & {
  type: 'initSolutionTask'
  imageBase64: string
  recognize: string
  summary: string
}

export type Task = ExplainCodeTask | InitSolutionTask

async function startExplainCodeTask(task: ExplainCodeTask, get: () => TaskManagerStore) {
  const stream = await getExplainCodeStream(task.component.componentFilePath, task.component.locStart, task.component.locEnd)

  // 初始化
  task.content = ''
  get().updatedTask({
    id: task.id,
    status: 'processing',
    content: '',
  })

  handleStream(stream, {
    onMessage: (message) => {
      task.content = (task.content || '') + message
      get().updatedTask({
        id: task.id,
        content: task.content,
      })
    },
    onFinish: () => {
      get().updatedTask({
        id: task.id,
        status: 'completed',
      })
    },
  })
}

async function startInitSolutionTask(task: InitSolutionTask, get: () => TaskManagerStore) {
  // 初始化
  const solution = useSolutionManagerStore.getState().addSolution(task.id)
  solution.initTask = task
  solution.imageBase64 = task.imageBase64
  useSolutionManagerStore.getState().setCurrentSolution(task.id)
  useSolutionManagerStore.getState().updateSolution(solution)

  // // 处理流
  // const streamSSE = await getInitSolutionStream(task.imageBase64, task.id)

  // get().updatedTask({
  //   id: task.id,
  //   status: 'processing',
  // })

  // handleSSE(streamSSE, {
  //   onEvent: (type, data) => {
  //     if (type === 'recognize' || type === 'summary') {
  //       task[type] += data
  //       get().updatedTask({
  //         id: task.id,
  //         [type]: task[type],
  //       })
  //     }
  //   },
  //   onFinish: () => {
  //     get().updatedTask({
  //       id: task.id,
  //       status: 'completed',
  //     })
  //   },
  // })
}

interface TaskManagerState {
  explainCodeTasks: Record<ExplainCodeTask['id'], ExplainCodeTask>
  initSolutionTasks: Record<InitSolutionTask['id'], InitSolutionTask>
  currentTask?: Task
}

interface TaskManagerActions {
  addExplainCodeTask: (component: LocalComponent) => Promise<ExplainCodeTask>
  addInitSolutionTask: (solutionId: string, imageBase64: string) => Promise<InitSolutionTask>
  updatedTask: <T extends Task>(task: Partial<T> & Pick<T, 'id'>) => void
  setCurrentTask: (task: Task['id']) => void
}

type TaskManagerStore = TaskManagerState & TaskManagerActions

export const useTaskManagerStore = create<TaskManagerStore>((set, get) => {
  return {
    explainCodeTasks: {},
    initSolutionTasks: {},
    currentTask: undefined,

    addExplainCodeTask: async (component) => {
      const { componentKey } = component
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

        set(() => ({
          explainCodeTasks: {
            [newTask.id]: newTask,
          },
        }))

        task = newTask
        startExplainCodeTask(task, get)
      }

      return task
    },
    addInitSolutionTask: async (solutionId, imageBase64) => {
      let task = find(get().initSolutionTasks, { id: solutionId })

      if (!task) {
        const newTask = {
          type: 'initSolutionTask',
          id: solutionId,
          imageBase64,
          recognize: '',
          summary: '',
        } as InitSolutionTask

        set(() => ({
          initSolutionTasks: {
            [newTask.id]: newTask,
          },
        }))

        task = newTask
        startInitSolutionTask(task, get)
      }

      return task
    },
    setCurrentTask(id) {
      const currentTask = find(get().explainCodeTasks, { id })
      set(() => ({
        currentTask,
      }))
    },
    updatedTask(task) {
      set(pre => ({
        explainCodeTasks: {
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
