import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    disableConsoleIntercept: true,
    exclude: ['test/init.ts', 'node_modules/**'],
    include: ['test/**/*.ts'],
    setupFiles: ['test/init.ts'],
    testTimeout: 5000,
  },
})
