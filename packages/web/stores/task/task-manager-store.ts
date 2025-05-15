import type { LocalComponent } from '@module-toolbox/anaylzer'
import { getExplainCodeStream } from '@/actions/explain-code'
import { handleStream } from '@/lib/utils'
import { find } from 'lodash'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useSolutionStore } from '../page/solution-store'

interface TaskManagerState {
  explainCodeTasks: Record<ExplainCodeTask['id'], ExplainCodeTask>
  initSolutionTasks: Record<InitSolutionTask['id'], InitSolutionTask>
}

interface TaskManagerActions {
  addExplainCodeTask: (component: LocalComponent) => Promise<ExplainCodeTask>
  addInitSolutionTask: (solutionId: string, imageBase64: string) => Promise<InitSolutionTask>
}

export const useTaskManagerStore = create<TaskManagerState & TaskManagerActions>()(immer((set, get) => {
  return {
    explainCodeTasks: {},
    initSolutionTasks: {},

    addExplainCodeTask: async (component) => {
      const { componentKey } = component
      let task = find(get().explainCodeTasks, { id: component.componentKey })

      if (!task) {
        const newTask = {
          type: 'explainCodeTask',
          id: componentKey,
          component,
          status: 'pending',
          content: '',
          createdAt: new Date(),
        } as ExplainCodeTask
        set((state) => {
          state.explainCodeTasks[newTask.id] = newTask
        })

        task = newTask
        startExplainCodeTask(task)
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

        set((state) => {
          state.initSolutionTasks[newTask.id] = newTask
        })

        task = newTask
        startInitSolutionTask(task)
      }

      return task
    },
  }
}))

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface BaseTask {
  type: string
  id: string
  status: TaskStatus
  error?: string
}

export type InitSolutionTask = BaseTask & {
  type: 'initSolutionTask'
  imageBase64: string
  recognize: string
  summary: string
}

async function startInitSolutionTask(task: InitSolutionTask) {
  // 初始化
  useSolutionStore.setState((state) => {
    state.solutions[task.id] = {
      type: 'Solution',
      id: task.id,
      createdAt: new Date(),
      imageBase64: task.imageBase64,
      initTask: task,
    }
  })

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

export type ExplainCodeTask = BaseTask & {
  type: 'explainCodeTask'
  content?: string
  component: LocalComponent
  createdAt: Date
}

async function startExplainCodeTask(task: ExplainCodeTask) {
  const stream = await getExplainCodeStream(task.component.componentFilePath, task.component.locStart, task.component.locEnd)
  useTaskManagerStore.setState((state) => {
    state.explainCodeTasks[task.id].status = 'processing'
  })

  handleStream(stream, {
    onMessage: (message) => {
      useTaskManagerStore.setState((state) => {
        state.explainCodeTasks[task.id].content += message
      })
    },
    onFinish: () => {
      useTaskManagerStore.setState((state) => {
        state.explainCodeTasks[task.id].status = 'completed'
      })
    },
  })
}
