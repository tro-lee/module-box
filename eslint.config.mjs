import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'antfu/no-top-level-await': 'off',
    'no-console': 'off',
    'unused-imports/no-unused-vars': 'off',
    'node/prefer-global/process': 'off',
    'ts/no-require-imports': 'off',
  },
  ignores: ['**/components/ui/*', '**/*.json', '**/generated/*'],
})
