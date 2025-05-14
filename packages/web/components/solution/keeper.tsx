'use client'

import { useSolutionManagerStore } from '@/store/solution-manager-store'
import { useParams } from 'next/navigation'
import { useEffect } from 'react'

// 保证url和共享状态一致
export function Keeper() {
  const getSolution = useSolutionManagerStore(state => state.getSolution)
  const setCurrentSolution = useSolutionManagerStore(state => state.setCurrentSolution)
  const currentSolutionId = useSolutionManagerStore(state => state.currentSolution?.id)
  const params = useParams<{ id: string }>()

  useEffect(() => {
    if (currentSolutionId === params.id) {
      return
    }

    const solution = getSolution(params.id)
    setCurrentSolution(solution.id)
  }, [params.id, currentSolutionId, getSolution, setCurrentSolution])

  return <></>
}
