import type { Choice } from '../types'

export default {
  name: 'Exit - 退出',
  value: 'exit',
  description: '退出程序',
  function: () => {
    process.exit(0)
  },
} as Choice
