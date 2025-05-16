import type { Solution } from '../atoms/solution'
import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { solutionsAtom } from '../atoms/solution'

export function useSolutionManager() {
  const setSolutions = useSetAtom(solutionsAtom)

  const addSolution = useCallback((initSolutionTaskId: string, solution: Pick<Solution, 'id' | 'imageBase64' | 'name'>) => {
    const newSolution = {
      type: 'Solution',
      name: solution.name,
      id: solution.id,
      imageBase64: solution.imageBase64,
      initSolutionTaskId,
      createdAt: new Date(),
      items: [],
    } as Solution
    setSolutions((prev) => {
      prev[solution.id] = newSolution
    })

    return newSolution
  }, [setSolutions])

  const addSolutionItem = useCallback((solutionId: string, item: Pick<Solution['items'][number], 'imageBase64'>) => {
    const newItem = {
      id: uuid(),
      imageBase64: item.imageBase64,
      createdAt: new Date(),
      content: '',
      status: 'pending',
    } as Solution['items'][number]

    setSolutions((draft) => {
      const solution = draft[solutionId]
      if (solution) {
        solution.items.push(newItem)
      }
    })
  }, [setSolutions])

  return {
    addSolution,
    addSolutionItem,
  }
}
