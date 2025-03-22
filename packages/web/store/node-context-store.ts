import { Component, Module } from "module-toolbox-library";
import { create } from "zustand";

interface NodeContext {
  currentNode: Module | Component | null;
  setCurrentNode: (node: Module | Component | null) => void;
}

export const useNodeContextStore = create<NodeContext>((set) => ({
  currentNode: null,
  setCurrentNode: (node: Module | Component | null) =>
    set({ currentNode: node }),
}));
