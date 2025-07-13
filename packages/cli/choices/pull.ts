import type { Choice } from '../types'

export default {
  name: 'Pull - 拉取模块',
  value: 'pull',
  description: '从远程仓库拉取最新模块',
  function: () => {
    console.log('pull')
  },
} as Choice
