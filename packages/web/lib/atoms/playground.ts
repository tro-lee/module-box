import type { Component } from '@module-toolbox/anaylzer'
import { atom } from 'jotai'

export const selectedComponentAtom = atom<Component | undefined>()
