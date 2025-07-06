import type { Draft } from '@/lib/types'
import { atomWithImmer } from 'jotai-immer'

export const draftsAtom = atomWithImmer<Record<Draft['id'], Draft>>({})
