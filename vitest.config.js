import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.js'],
    exclude: ['test/init.js', 'node_modules/**'],
    setupFiles: ['test/init.js'],
    testTimeout: 5000,
    // @heroku/heroku-cli-util writes via console.log; runCommand from
    // @heroku-cli/test-utils captures via process.stdout.write, so vitest's
    // default console intercept must be off for output to be captured.
    disableConsoleIntercept: true
  }
})
