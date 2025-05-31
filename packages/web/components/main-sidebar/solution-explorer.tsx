'use client'
'use module'

import type { Solution } from '../../lib/atoms/solution'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

import { zhCN } from 'date-fns/locale'
import { useAtomValue } from 'jotai'
import { values } from 'lodash'
import { BadgePlus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { solutionsAtom } from '../../lib/atoms/solution'

function SolutionItem({ solution }: { solution: Solution }) {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
  }

  const handleClick = () => {
    router.push(`/update-solution/${solution.id}`)
  }

  const isSelected = solution.id === params.id

  return (
    <div
      className={cn(
        'text-sm text-muted-foreground p-1 rounded-sm w-full flex flex-row justify-between items-center cursor-pointer',
        isSelected ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent',
      )}
      onClick={handleClick}
    >
      <p>
        {solution.name}
      </p>
      <p className="text-xs">{formatTime(solution.createdAt)}</p>
    </div>
  )
}

export function SolutionExplorer() {
  const router = useRouter()
  const solutions = useAtomValue(solutionsAtom)

  return (
    <>
      <nav className="flex items-center text-muted-foreground">
        <Button
          className="text-muted-foreground p-2 flex items-center gap-1"
          onClick={() => router.push(`/create-solution/${uuidv4()}`)}
          variant="link"
          size="sm"
        >
          <BadgePlus />
          <p>创建新方案</p>
        </Button>
      </nav>
      <ScrollArea className="p-1">
        {
          values(solutions).map(solution => (
            <SolutionItem key={solution.id} solution={solution} />
          ))
        }
      </ScrollArea>
    </>
  )
}
