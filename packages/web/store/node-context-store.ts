import { Component, Module } from "module-toolbox-library";
import { create } from "zustand";

interface NodeContext {
  selectedNodes: Array<Module | Component>;
  setSelectedNodes: (nodes: Array<Module | Component>) => void;
}

export const useNodeContextStore = create<NodeContext>((set) => ({
  selectedNodes: [],
  setSelectedNodes: (nodes: Array<Module | Component>) =>
    set({ selectedNodes: nodes }),
}));
