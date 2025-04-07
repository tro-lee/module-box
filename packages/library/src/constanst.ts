import type { Component } from './types'

// HOC白名单配置
// 用于在声明转换组件时，判断变量声明是否为HOC组件
export const HOC_WHITELIST: Record<string, { paramIndex: number }> = {
  forwardRef: {
    paramIndex: 0, // 取第0个参数作为组件函数
  },
}

// 全局组件上下文
// 用于记录已经转换成功的组件
export const GlobalComponentContext: Record<string, Component> = {}
