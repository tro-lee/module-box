import { create } from 'zustand'

interface PlaygroundState {
  rootPath: string
  selectedRelativePath: string | null
}

interface PlaygroundActions {
  setRootPath: (path: string) => void
  setselectedRelativePath: (file: string | null) => void
}

type PlaygroundStore = PlaygroundState & PlaygroundActions

export const usePlaygroundStore = create<PlaygroundStore>((set, get) => ({
  rootPath: '',
  selectedRelativePath: null,
  setRootPath: path => set(state => state.rootPath !== path ? { rootPath: path } : {}),
  setselectedRelativePath: file => set(
    state => state.selectedRelativePath !== file
      ? { selectedRelativePath: file }
      : {},
  ),
}))
