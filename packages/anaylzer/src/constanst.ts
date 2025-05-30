import type { Component, Hook } from './types'

// HOC白名单配置
// 用于在声明转换组件时，判断变量声明是否为HOC组件
export const HOC_WHITELIST: Record<string, { paramIndex: number }> = {
  forwardRef: {
    paramIndex: 0, // 取第0个参数作为组件函数
  },
  memo: {
    paramIndex: 0,
  },
}

// Hook黑名单配置
// 用于在声明转换Hook时，将基础库提供的Hook函数排除
export const HOOK_BLACKLIST: string[] = [
  'useState',
  'useEffect',
  'useRef',
  'useCallback',
  'useMemo',
  'use',
  'useReducer',
]

// 全局组件上下文
// 用于记录已经转换成功的组件
export const GlobalComponentContext: Record<string, Component> = {}

// 全局Hook上下文
// 用于记录已经转换成功的Hook
export const GlobalHookContext: Record<string, Hook> = {}
