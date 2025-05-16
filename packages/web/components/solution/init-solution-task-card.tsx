import type { InitSolutionTask } from '@/lib/types'
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from '@/components/ui/timeline'
import { cn } from '@/lib/utils'
import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Spinner } from '../ui/spinner'

export function InitSolutionTaskCard({ task }: { task?: InitSolutionTask }) {
  let textStatus = '正在扫描信息...'
  if (task?.recognize) {
    textStatus = '正在识别信息...'
  }
  if (task?.summary) {
    textStatus = '正在总结信息...'
  }
  if (task?.status === 'completed') {
    textStatus = '信息识别完成'
  }

  const [isExpanded, setIsExpanded] = useState(true)
  const toggleExpand = () => {
    setIsExpanded(prev => !prev)
  }

  const timelineContent = []
  if (task?.recognize) {
    timelineContent.push({ heading: '识别结果', content: task?.recognize })
  }
  if (task?.summary) {
    timelineContent.push({ heading: '总结结果', content: task?.summary })
  }

  return (
    <Card className="flex flex-col p-2 w-full shadow-sm text-muted-foreground">
      <section className="flex flex-row justify-between items-center py-0 px-2 text-muted-foreground text-sm">
        <div className="flex flex-row items-center gap-2">
          <Spinner variant="pinwheel" className="w-4 h-4" />
          {textStatus}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpand}
        >
          {isExpanded ? '收起' : '展开'}
        </Button>
      </section>

      <Timeline className={cn('w-full', isExpanded ? '' : 'max-h-0 overflow-hidden')}>
        {
          timelineContent.map((item, index) => (
            <TimelineItem key={item.heading}>
              <TimelineHeading>{item.heading}</TimelineHeading>
              <TimelineDot />
              <TimelineLine />
              <TimelineContent>
                {item.content}
              </TimelineContent>
            </TimelineItem>
          ))
        }
      </Timeline>
    </Card>
  )
}
