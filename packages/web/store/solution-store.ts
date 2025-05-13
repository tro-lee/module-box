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
  detail: Array<SolutionTask>
  error?: string
}

interface SolutionManagerState {
  solutions: Record<Solution['id'], Solution>
  currentSolution?: Solution
}

interface SolutionManagerActions {
  addSolutionTask: (solutionId: string, imgData: string) => void
  getSolution: (solutionId: string) => Solution
  setSolution: (solution: Partial<Solution> & Pick<Solution, 'id'>) => void
}

type SolutionManagerStore = SolutionManagerState & SolutionManagerActions

export const useSolutionManagerStore = create<SolutionManagerStore>((set, get) => {
  return {
    solutions: {},
    currentSolution: undefined,

    getSolution(solutionId: string) {
      let currentSolution = get().solutions[solutionId]
      if (!currentSolution) {
        currentSolution = {
          type: 'Solution',
          id: solutionId,
          createdAt: new Date(),
          detail: [],
        }
      }
      set(state => ({
        currentSolution: {
          ...state.currentSolution,
          ...currentSolution,
        },
      }))
      return currentSolution
    },

    addSolutionTask: (solutionId: string, imgData: string) => {
      const currentSolution = get().getSolution(solutionId)

      currentSolution.detail.push({
        id: uuidv4(),
        status: 'pending',
        imgData,
        createdAt: new Date(),
      })

      get().setSolution(currentSolution)
    },

    setSolution(solution) {
      const currentSolution = get().getSolution(solution.id)

      set(state => ({
        solutions: {
          ...state.solutions,
          [solution.id]: {
            ...currentSolution,
            ...solution,
          },
        },
      }))

      if (solution.id === get().currentSolution?.id) {
        set({
          currentSolution: {
            ...get().currentSolution!,
            ...solution,
          },
        })
      }
    },
  }
})
