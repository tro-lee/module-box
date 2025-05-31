'use client'

import { selectedComponentAtom, selectedSidebarTypeAtom } from '@/lib/atoms/playground'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { ComponentCodeBlock } from './code-block'
import { ComponentCodeExplainer } from './code-explainer'
import { NavigatorButtons } from './navigator'

export function MotionDiv({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
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

export function ComponentSidebar() {
  const currentTab = useAtomValue(selectedSidebarTypeAtom)
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
          currentTab === 'solution' && (
            <MotionDiv key="solution">
              <ComponentCodeExplainer component={selectedComponent} />
            </MotionDiv>
          )
        }
      </AnimatePresence>
    </aside>
  )
}
