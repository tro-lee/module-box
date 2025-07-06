import type { Component } from '@module-toolbox/anaylzer'
import type { Edge, Node } from '@xyflow/react'
import { atom } from 'jotai'
import { atomWithImmer } from 'jotai-immer'

export const moduleFlowNodesAtom = atomWithImmer<Node[]>([])
export const moduleFlowEdgesAtom = atomWithImmer<Edge[]>([])

export const selectedComponentAtom = atom<Component | undefined>()
export const selectedToolbarTypeAtom = atom<string>('')
