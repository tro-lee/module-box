import type { Choice } from '../types'

export default {
  name: 'Push - 推送模块',
  value: 'push',
  description: '将当前模块推送到远程仓库',
  function: () => {
    console.log('push')
  },
} as Choice
