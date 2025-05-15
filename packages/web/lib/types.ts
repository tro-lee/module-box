import type { LocalComponent } from '@module-toolbox/anaylzer'

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
export type ExplainCodeTask = BaseTask & {
  type: 'explainCodeTask'
  content?: string
  component: LocalComponent
  createdAt: Date
}
