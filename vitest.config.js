import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.js'],
    exclude: ['test/init.js', 'node_modules/**'],
    setupFiles: ['test/init.js'],
    testTimeout: 5000,
    disableConsoleIntercept: true
  }
})
