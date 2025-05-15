'use client'
'use module'

import type { Solution } from '@/stores/page/solution-store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSolutionStore } from '@/stores/page/solution-store'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { values } from 'lodash'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { v4 as uuidv4 } from 'uuid'

function SolutionItem({ solution }: { solution: Solution }) {
  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
  }

  return (
    <div className="flex flex-col mb-2 p-2 hover:bg-accent rounded-md cursor-pointer">
      <Button className="flex items-center gap-2" variant="outline">
        <p className="text-sm">
          方案 #
          {solution.id}
        </p>
      </Button>
      {solution.error && (
        <p className="text-xs text-red-500 mt-1">{solution.error}</p>
      )}
      <div className="text-xs text-muted-foreground mt-1">
        <p>{formatTime(solution.createdAt)}</p>
      </div>
    </div>
  )
}

export function SolutionExplorer() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const solutions = useSolutionStore(state => state.solutions)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      <nav className="flex items-center text-muted-foreground">
        <Button
          className="text-muted-foreground"
          onClick={() => router.push(`/create-solution/${uuidv4()}`)}
          variant="link"
          size="sm"
        >
          <p>创建新方案</p>
        </Button>
      </nav>
      <ScrollArea className="p-2">
        {
          values(solutions).map(solution => (
            <SolutionItem key={solution.id} solution={solution} />
          ))
        }
        <div className="flex flex-col items-center justify-center gap-4">
        </div>
      </ScrollArea>
    </>
  )
}
