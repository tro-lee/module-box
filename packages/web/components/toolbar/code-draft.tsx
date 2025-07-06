import type { LocalComponent } from '@module-toolbox/anaylzer'
import { ListPlus } from 'lucide-react'

const mockDrafts = [
  {
    id: '1',
    name: 'Draft 1',
    nodeIds: ['1', '2', '3'],
  },
]

export function ComponentCodeDraft({ component }: { component: LocalComponent }) {
  return (
    <div className="w-96 max-h-[90vh] overflow-auto rounded-lg border bg-sidebar p-2 text-muted-foreground">
      {mockDrafts.map(draft => (
        <div key={draft.id} className="flex flex-row items-center justify-between">
          <h3>{draft.name}</h3>
          <ListPlus className="size-4" />
        </div>
      ))}
    </div>
  )
}
