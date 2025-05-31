'use client'

import { selectedSidebarTypeAtom } from '@/lib/atoms/playground'
import { cn } from '@/lib/utils'
import { useAtom } from 'jotai'
import { FileBox, FileCode, FileText } from 'lucide-react'
import { useCallback } from 'react'
import { Toggle } from '../ui/toggle'

const navigatorButtonTypes = ['code', 'explain', 'solution'] as const

function NavigatorButton({ children, type }: { children: React.ReactNode, type: typeof navigatorButtonTypes[number] }) {
  const [selectedSidebarType, setSelectedSidebarType] = useAtom(selectedSidebarTypeAtom)

  const onClick = useCallback(() => {
    setSelectedSidebarType((prev) => {
      if (prev === type) {
        return 'none'
      }
      return type
    })
  }, [type, setSelectedSidebarType])

  return (
    <Toggle variant="outline" onClick={onClick} pressed={type === selectedSidebarType} className="bg-sidebar" size="sm">
      {children}
    </Toggle>
  )
}

const icons = {
  code: <FileCode className="size-4" />,
  explain: <FileText className="size-4" />,
  solution: <FileBox className="size-4" />,
}

export function NavigatorButtons({ className }: { className?: string }) {
  return (
    <nav className={cn('flex flex-row items-center gap-2', className)}>
      {navigatorButtonTypes.map(type => (
        <NavigatorButton key={type} type={type}>
          {icons[type]}
        </NavigatorButton>
      ))}
    </nav>
  )
}
