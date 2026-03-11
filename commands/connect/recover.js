import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

export default {
  topic: 'connect',
  command: 'recover',
  aliases: ['connect:restart'],
  description: 'Recover a connection',
  help: 'Clears errors and attempts to resume sync operations',
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    await cli.action('recovering connection', (async function () {
      const connection = await api.withConnection(context, heroku)
      context.region = connection.region_url
      const url = '/api/v3/connections/' + connection.id + '/actions/restart'
      await api.request(context, 'POST', url)
    })())
  })
}
