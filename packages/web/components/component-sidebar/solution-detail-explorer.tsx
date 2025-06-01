'use client'

import type { Solution } from '@/lib/atoms/solution'
import { solutionsAtom } from '@/lib/atoms/solution'
import { anaylzeSolutionItemTasksAtom } from '@/lib/atoms/task'
import { useAtomValue } from 'jotai'
import { keys, values } from 'lodash'
import ReactMarkdown from 'react-markdown'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card'

function SolutionItem({ item }: { item: Solution['items'][number] }) {
  const tasks = useAtomValue(anaylzeSolutionItemTasksAtom)
  const currentTask = tasks?.[item.anaylzeSolutionItemTaskId]

  return (
    <div className="mt-2 text-muted-foreground">
      {
        currentTask.status === 'pending'
          ? (
              <div className="h-16 border rounded-lg overflow-auto w-full">
                <HoverCard>
                  <HoverCardTrigger>
                    <img
                      src={currentTask.imageBase64}
                      alt=""
                      className="h-full w-full object-cover animate-pulse"
                    />
                  </HoverCardTrigger>
                  <HoverCardContent className="p-2">
                    <img src={currentTask.imageBase64} alt="" className="object-contain" />
                  </HoverCardContent>
                </HoverCard>
              </div>
            )
          : (
              <div className="max-h-[80vh] rounded-lg overflow-auto w-full relative">
                <ReactMarkdown children={currentTask.result} />
              </div>
            )
      }
    </div>
  )
}

function SolutionDetail({ solution }: { solution: Solution }) {
  return (
    <div className="p-2">
      <h3 className="text-base font-semibold">{solution.name}</h3>
      {values(solution.items).map(item => (
        <SolutionItem key={item.id} item={item} />
      ))}
    </div>
  )
}

export function SolutionDetailExplorer() {
  const solutions = useAtomValue(solutionsAtom)

  if (keys(solutions).length === 0) {
    return <></>
  }
  return (
    <aside className="flex flex-col gap-2 p-2 w-96 max-h-[90vh] rounded-lg border bg-sidebar">
      {values(solutions).map(solution => (
        <SolutionDetail key={solution.id} solution={solution} />
      ))}
    </aside>
  )
}
