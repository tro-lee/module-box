import type { InitSolutionTask } from '../task/task-manager-store'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface Solution {
  type: 'Solution'
  id: string
  createdAt: Date
  initTask?: InitSolutionTask
  imageBase64?: string
  error?: string
}

interface SolutionState {
  solutions: Record<Solution['id'], Solution>
}

export const useSolutionStore = create<SolutionState>()(immer((set, get) => {
  return {
    solutions: {},
  }
}))
