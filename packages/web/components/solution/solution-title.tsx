'use client'

import { solutionsAtom } from '@/lib/atoms/solution'
import { useAtomValue } from 'jotai'
import { useParams } from 'next/navigation'
import { SidebarTrigger } from '../ui/sidebar'

export function SolutionTitle() {
  const params = useParams<{ id: string }>()
  const solutions = useAtomValue(solutionsAtom)
  const currentSolution = solutions?.[params.id]

  return (
    <nav className="flex items-center gap-2 text-muted-foreground">
      <SidebarTrigger />
      <p className="text-sm">{currentSolution?.name}</p>
    </nav>
  )
}
