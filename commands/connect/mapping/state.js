import * as api from '../../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

export default {
  topic: 'connect:mapping',
  command: 'state',
  description: 'return a mapping state',
  help: 'return a mapping state',
  args: [
    { name: 'mapping' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    const connection = await api.withConnection(context, heroku)
    context.region = connection.region_url
    const mapping = await api.withMapping(connection, context.args.mapping)

    cli.log(mapping.state)
  })
}
