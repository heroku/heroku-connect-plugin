import * as api from '../../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

export default {
  topic: 'connect-events:stream',
  command: 'delete',
  description: 'Delete an existing stream',
  help: 'Delete an existing stream',
  args: [
    { name: 'stream' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true },
    { name: 'confirm', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    await cli.confirmApp(context.app, context.flags.confirm)

    await cli.action('deleting stream', (async function () {
      const connection = await api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
      context.region = connection.region_url
      const stream = await api.withStream(context, connection, context.args.stream)
      const response = await api.request(context, 'DELETE', `/api/v3/streams/${stream.id}`)
      if (response.status !== 204) {
        throw new Error(response.data.message || 'unknown error')
      }
    })())
  })
}
