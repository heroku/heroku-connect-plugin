import * as api from '../../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

export default {
  topic: 'connect-events:stream',
  command: 'state',
  description: 'return a stream state',
  help: 'return a stream state',
  args: [
    { name: 'stream' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    const connection = await api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
    context.region = connection.region_url
    const stream = await api.withStream(context, connection, context.args.stream)

    cli.log(stream.state)
  })
}
