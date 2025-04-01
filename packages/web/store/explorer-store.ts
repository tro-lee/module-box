import { create } from 'zustand'

interface ExplorerState {
  rootPath: string
  selectedRelativeFilePath: string | null
}

interface ExplorerActions {
  setRootPath: (path: string) => void
  setSelectedRelativeFilePath: (file: string | null) => void
  getSelectedAbsolutePath: () => string
}

type ExplorerStore = ExplorerState & ExplorerActions

export const useExplorerStore = create<ExplorerStore>((set, get) => ({
  // State
  rootPath: '',
  selectedRelativeFilePath: null,

  // Actions
  setRootPath: path => set({ rootPath: path }),
  setSelectedRelativeFilePath: file =>
    set({ selectedRelativeFilePath: file }),
  getSelectedAbsolutePath: () =>
    `${get().rootPath}/${get().selectedRelativeFilePath || ''}`,
}))
