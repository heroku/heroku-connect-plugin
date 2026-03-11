import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

export default {
  topic: 'connect:mapping',
  command: 'write-errors',
  description: 'Display the last 24 hours of write errors on this mapping',
  examples: [
    '$ heroku connect:mapping:write-errors -a myapp --resource herokuconnect-twisted-123 Account'
  ],
  args: [
    {
      name: 'name',
      optional: false,
      description: 'Name of the mapping to retrieve errors for'
    }
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
