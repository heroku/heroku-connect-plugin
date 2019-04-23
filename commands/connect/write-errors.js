'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('heroku-cli-util')

module.exports = {
  topic: 'connect',
  command: 'write-errors',
  description: 'Display the last 24 hours of write errors on this connection',
  examples: [
    `$ heroku connect:write-errors -a myapp --resource herokuconnect-twisted-123`
  ],
  flags: [
    {
      name: 'resource',
      description: 'specific connection resource name',
      hasValue: true
    },
    {
      name: 'json',
      description: 'print errors as styled JSON',
      hasValue: false
    }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(api.getWriteErrors)
}
