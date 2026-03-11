import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

export default {
  topic: 'connect:mapping',
  command: 'delete',
  description: 'Delete an existing mapping',
  help: 'Delete an existing mapping',
  args: [
    { name: 'mapping' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true },
    { name: 'confirm', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    await cli.confirmApp(context.app, context.flags.confirm)

    await cli.action('deleting mapping', (async function () {
      const connection = await api.withConnection(context, heroku)
      context.region = connection.region_url
      const mapping = await api.withMapping(connection, context.args.mapping)
      const response = await api.request(context, 'DELETE', '/api/v3/mappings/' + mapping.id)
      if (response.status !== 204) {
        throw new Error(response.data.message || 'unknown error')
      }
    })())
  })
}
