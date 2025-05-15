import type { InitSolutionTask } from '@/lib/types'
import { atomWithImmer } from 'jotai-immer'

export interface Solution {
  type: 'Solution'
  id: string
  createdAt: Date
  initTask?: InitSolutionTask
  imageBase64?: string
  error?: string
}

export const solutionsAtom = atomWithImmer<Record<Solution['id'], Solution>>({})
