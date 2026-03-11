import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

export default {
  topic: 'connect:mapping',
  command: 'reload',
  description: "Reload a mapping's data from Salesforce",
  help: "Reload a mapping's data from Salesforce",
  args: [
    { name: 'mapping' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    await cli.action(`initiating reload of ${context.args.mapping}`, (async function () {
      const connection = await api.withConnection(context, heroku)
      context.region = connection.region_url
      const mapping = await api.withMapping(connection, context.args.mapping)

      const response = await api.request(context, 'POST', '/api/v3/mappings/' + mapping.id + '/actions/reload')
      if (response.status !== 202) {
        throw new Error(response.data.message || 'unknown error')
      }
    })())
  })
}
