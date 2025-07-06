import type { LocalComponent } from '@module-toolbox/anaylzer'

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface BaseTask {
  type: string
  id: string
  status: TaskStatus
  createdAt: Date
  // https://www.reddit.com/r/javascript/comments/a3qlpr/do_i_need_to_use_a_stringbuffer_in_2018_javascript/
  // 浏览器js直接拼接字符串，比其他方式拼接快许多
  message: string
  sse: Record<string, string>
  error?: string
}

export type ExplainCodeTask = BaseTask & {
  type: 'explainCodeTask'
  component: LocalComponent
}

export type Task = ExplainCodeTask

export interface Draft {
  id: string
  name: string
  nodeIds: string[] // 包含节点
}
