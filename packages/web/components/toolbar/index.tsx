'use client'

import { selectedComponentAtom, selectedToolbarTypeAtom } from '@/lib/atoms/module-flow'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtom, useAtomValue } from 'jotai'
import { DraftingCompass, FileCode, FileText } from 'lucide-react'
import { useCallback } from 'react'
import { Toggle } from '../ui/toggle'
import { ComponentCodeBlock } from './code-block'
import { ComponentCodeDraft } from './code-draft'
import { ComponentCodeExplainer } from './code-explainer'

const navigatorButtonTypes = ['code', 'explain', 'draft'] as const

function NavigatorButton({ children, type }: { children: React.ReactNode, type: typeof navigatorButtonTypes[number] }) {
  const [selectedSidebarType, setSelectedSidebarType] = useAtom(selectedToolbarTypeAtom)

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

function NavigatorButtons({ className }: { className?: string }) {
  const icons = {
    code: <FileCode className="size-4" />,
    explain: <FileText className="size-4" />,
    draft: <DraftingCompass className="size-4" />,
  }

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

function MotionDiv({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

export function Toolbar() {
  const currentTab = useAtomValue(selectedToolbarTypeAtom)
  const selectedComponent = useAtomValue(selectedComponentAtom)

  if (!selectedComponent || selectedComponent.type !== 'LocalComponent') {
    return <></>
  }

  return (
    <aside className="flex flex-col items-end justify-end gap-2 p-2">
      <nav className="flex flex-row gap-2 items-center text-muted-foreground w-96">
        <div className="flex-1 bg-sidebar rounded-md h-8 border flex items-center p-2 text-sm overflow-hidden">
          <span className="truncate">
            /
            {selectedComponent.componentFilePath.split('/').slice(-2).join('/')}
          </span>
        </div>
        <NavigatorButtons className="flex-shrink-0" />
      </nav>

      <AnimatePresence>
        {
          currentTab === 'code'
          && (
            <MotionDiv key="code">
              <ComponentCodeBlock component={selectedComponent} />
            </MotionDiv>
          )
        }
        {
          currentTab === 'explain' && (
            <MotionDiv key="explain">
              <ComponentCodeExplainer component={selectedComponent} />
            </MotionDiv>
          )
        }
        {
          currentTab === 'draft' && (
            <MotionDiv key="draft">
              <ComponentCodeDraft component={selectedComponent} />
            </MotionDiv>
          )
        }
      </AnimatePresence>
    </aside>
  )
}
