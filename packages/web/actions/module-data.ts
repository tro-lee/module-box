import type { Component, Module } from 'module-toolbox-library'
import { API_URL } from '@/lib/constants'

// 查询某文件目录下的模块

export async function getModulesByPath(path: string): Promise<{
  modules: Record<string, Module>
  components: Record<string, Component>
}> {
  const response = await fetch(`${API_URL}/modules-by-path?filepath=${path}`)
  const data = await response.json()
  if (data.status === 'success') {
    return data.data
  }
  else {
    console.error(data.message)
    return {
      modules: {},
      components: {},
    }
  }
}
