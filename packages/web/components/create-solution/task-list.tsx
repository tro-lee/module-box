'use client'

import { useSolutionManagerStore } from '@/store/solution-store'

export function TaskList() {
  const currentSolution = useSolutionManagerStore(state => state.currentSolution)

  return (
    <div className="flex flex-col flex-1">
      <h1 className="text-lg font-bold">方案列表</h1>
      {currentSolution?.detail.map(task => (
        <div key={task.id} className="flex items-center gap-2">
          <p>{task.status}</p>
          <img src={task.imgData} alt="Task" className="w-16 h-16" />
        </div>
      ))}

      {currentSolution?.detail.length === 0 && (
        <p className="text-sm text-muted-foreground">没有任务</p>
      )}
    </div>

  )
}
