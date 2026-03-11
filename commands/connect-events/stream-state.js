import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import co from 'co'

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
  run: cli.command(co.wrap(function * (context, heroku) {
    const connection = yield api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
    context.region = connection.region_url
    const stream = yield api.withStream(context, connection, context.args.stream)

    cli.log(stream.state)
  }))
}
