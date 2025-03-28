import { create } from 'zustand'

interface ExplorerState {
  selectedFile: string | null
  setSelectedFile: (file: string | null) => void
}

export const useExplorerStore = create<ExplorerState>(set => ({
  selectedFile: null,
  setSelectedFile: (file: string | null) =>
    set({ selectedFile: file }),
}))
