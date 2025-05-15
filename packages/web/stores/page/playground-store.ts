import type { Component } from '@module-toolbox/anaylzer'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface PlaygroundState {
  currentSelectedComponent: Component | undefined
}

export const usePlaygroundStore = create<PlaygroundState>()(immer((set, get) => ({
  currentSelectedComponent: undefined,
})))
