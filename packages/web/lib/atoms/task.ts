import type { ExplainCodeTask } from '@/lib/types'
import { atomWithImmer } from 'jotai-immer'

export const explainCodeTasksAtom = atomWithImmer<Record<ExplainCodeTask['id'], ExplainCodeTask>>({})
