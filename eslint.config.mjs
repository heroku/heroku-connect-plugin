import herokuEslintConfig from '@heroku-cli/test-utils/eslint-config'
import vitestEslintConfig from '@heroku-cli/test-utils/eslint-config/vitest'

export default [
  ...herokuEslintConfig,
  ...vitestEslintConfig,
  {
    ignores: ['dist', 'node_modules', 'bin', '**/*.js', '**/*.mjs', '**/*.cjs'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {modules: true},
        ecmaVersion: 6,
        sourceType: 'module',
      },
    },
    rules: {
      'jsdoc/require-returns-check': 'off',
      camelcase: ['error', {properties: 'never', ignoreDestructuring: true}],
      'unicorn/no-array-for-each': 'off',
      'no-await-in-loop': 'off',
      'guard-for-in': 'off',
      'import/no-named-as-default-member': 'off',
      'max-params': 'off',
    },
  },
]
