import type { AnaylzeSolutionItemTask, InitSolutionTask } from '../types'
import { atomWithImmer } from 'jotai-immer'

interface SolutionItem {
  id: string
  solutionId: string
  imageBase64: string
  content: string
  createdAt: Date
  anaylzeSolutionItemTaskId: AnaylzeSolutionItemTask['id']
}

export interface Solution {
  type: 'Solution'
  id: string
  createdAt: Date
  name: string
  imageBase64?: string
  error?: string
  items: Record<SolutionItem['id'], SolutionItem>
  initSolutionTaskId: InitSolutionTask['id']
}

export const solutionsAtom = atomWithImmer<Record<Solution['id'], Solution>>({})
