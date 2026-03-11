import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

async function run (context, heroku) {
  const connections = await api.withUserConnections(context, context.app, context.flags, heroku, true, api.ADDON_TYPE_EVENTS)

  if (context.flags.json) {
    cli.styledJSON(connections)
  } else {
    cli.table(connections, {
      columns: [
        { key: 'db_key', label: 'Kafka' },
        { key: 'schema_name', label: 'Schema' },
        { key: 'state', label: 'State' }
      ]
    })
  }
}

export default {
  topic: 'connect-events',
  command: 'state',
  description: 'return the connection(s) state',
  help: 'returns the state key of the selected connections',
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true },
    { name: 'json', description: 'print output as json', hasValue: false }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(run)
}
