import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import * as api from '../../lib/connect/api.js'
import fs from 'fs'

export default class ConnectExport extends Command {
  static description = 'Export configuration from a connection'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' })
  }

  async run () {
    const { flags } = await this.parse(ConnectExport)
    const context = {
      app: flags.app,
      flags,
      args: {},
      auth: { password: this.heroku.auth }
    }

    let connection, response

    await cli.action('fetching configuration', (async function () {
      connection = await api.withConnection(context, this.heroku)
      context.region = connection.region_url
      const url = '/api/v3/connections/' + connection.id + '/actions/export'
      response = await api.request(context, 'GET', url)
    }.bind(this))())

    const fName = connection.app_name + '-' + (connection.resource_name || '') + '.json'

    await cli.action('writing configuration to file', {
      success: fName
    }, (async function () {
      fs.writeFileSync(fName, JSON.stringify(response.data, null, 4))
    })())
  }
}
