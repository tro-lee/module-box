import type { InitSolutionTask } from './task-manager-store'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'

interface SolutionTask {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  imgData?: string
  createdAt: Date
}

export interface Solution {
  type: 'Solution'
  id: string
  createdAt: Date
  initTask?: InitSolutionTask
  imageBase64?: string
  detail: Array<SolutionTask>
  error?: string
}

interface SolutionManagerState {
  solutions: Record<Solution['id'], Solution>
  currentSolution?: Solution
}

interface SolutionManagerActions {
  addSolutionTask: (solutionId: string, imgData: string) => void
  addSolution: (solutionId: string) => Solution
  getSolution: (solutionId: string) => Solution
  updateSolution: (solution: Partial<Solution> & Pick<Solution, 'id'>) => void
  setCurrentSolution: (solutionId: Solution['id']) => void
}

type SolutionManagerStore = SolutionManagerState & SolutionManagerActions

export const useSolutionManagerStore = create<SolutionManagerStore>((set, get) => {
  return {
    solutions: {},
    currentSolution: undefined,
    addSolution(solutionId) {
      const currentSolution = {
        type: 'Solution',
        id: solutionId,
        createdAt: new Date(),
        detail: [],
      } as Solution

      set(() => ({
        solutions: {
          [solutionId]: currentSolution,
        },
      }))
      return currentSolution
    },
    getSolution(solutionId) {
      const currentSolution = get().solutions[solutionId]
      if (!currentSolution) {
        throw new Error(`Solution with id ${solutionId} not found`)
      }

      return currentSolution
    },
    addSolutionTask: (solutionId, imgData) => {
      const currentSolution = get().getSolution(solutionId)

      currentSolution.detail.push({
        id: uuidv4(),
        status: 'pending',
        imgData,
        createdAt: new Date(),
      })

      get().updateSolution(currentSolution)
    },
    updateSolution(solution) {
      const currentSolution = get().getSolution(solution.id)

      set(() => ({
        solutions: {
          [solution.id]: {
            ...currentSolution,
            ...solution,
          },
        },
      }))

      console.log(currentSolution)
      console.log(solution)
      if (solution.id === get().currentSolution?.id) {
        console.log(currentSolution)
        set({
          currentSolution: {
            ...get().currentSolution!,
            ...solution,
          },
        })
      }
    },
    setCurrentSolution(solutionId) {
      const currentSolution = get().getSolution(solutionId)
      set(() => ({
        currentSolution,
      }))
    },
  }
})
