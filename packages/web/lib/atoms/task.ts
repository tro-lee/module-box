import type { AnaylzeSolutionItemTask, ExplainCodeTask, InitSolutionTask } from '@/lib/types'
import { atomWithImmer } from 'jotai-immer'

export const explainCodeTasksAtom = atomWithImmer<Record<ExplainCodeTask['id'], ExplainCodeTask>>({})
export const initSolutionTasksAtom = atomWithImmer<Record<InitSolutionTask['id'], InitSolutionTask>>({})
export const anaylzeSolutionItemTasksAtom = atomWithImmer<Record<AnaylzeSolutionItemTask['id'], AnaylzeSolutionItemTask>>({})
