import { atomWithImmer } from 'jotai-immer'

interface SolutionItem {
  id: string
  imageBase64: string
  content: string
  createdAt: Date
  status: 'pending' | 'process' | 'completed' | 'error'
}

export interface Solution {
  type: 'Solution'
  id: string
  createdAt: Date
  name: string
  imageBase64?: string
  error?: string
  items: SolutionItem[]
  initSolutionTaskId: string
}

export const solutionsAtom = atomWithImmer<Record<Solution['id'], Solution>>({})
