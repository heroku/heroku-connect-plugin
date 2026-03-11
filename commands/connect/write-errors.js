import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

export default {
  topic: 'connect',
  command: 'write-errors',
  description: 'Display the last 24 hours of write errors on this connection',
  examples: [
    '$ heroku connect:write-errors -a myapp --resource herokuconnect-twisted-123'
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
