import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import fs from 'fs'

export default {
  topic: 'connect',
  command: 'export',
  description: 'Export configuration from a connection',
  help: 'Exports the mapping configuration from a connection as a json file',
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    let connection, response

    await cli.action('fetching configuration', (async function () {
      connection = await api.withConnection(context, heroku)
      context.region = connection.region_url
      const url = '/api/v3/connections/' + connection.id + '/actions/export'
      response = await api.request(context, 'GET', url)
    })())

    const fName = connection.app_name + '-' + (connection.resource_name || '') + '.json'

    await cli.action('writing configuration to file', {
      success: fName
    }, (async function () {
      fs.writeFileSync(fName, JSON.stringify(response.data, null, 4))
    })())
  })
}
