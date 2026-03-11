import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

export default {
  topic: 'connect-events:stream',
  command: 'create',
  description: 'Create a stream',
  help: 'Create a stream',
  args: [
    { name: 'stream' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    await cli.action('creating stream', (async function () {
      const connection = await api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
      context.region = connection.region_url
      const response = await api.request(
        context, 'POST', `/api/v3/kafka-connections/${connection.id}/streams`,
        { object_name: context.args.stream }
      )
      if (response.status !== 201) {
        throw new Error(response.data.message || 'unknown error')
      }
    })())
  })
}
