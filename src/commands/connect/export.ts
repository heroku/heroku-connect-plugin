import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as fs from 'node:fs'

import {ConnectContext} from '../../lib/clients/connect.js'
import * as api from '../../lib/connect/api.js'

export default class ConnectExport extends Command {
  static description = 'Export configuration from a connection'
  static flags = {
    app: flags.app({required: true}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConnectExport)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    ux.action.start('fetching configuration')
    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url
    const url = `/api/v3/connections/${connection.id}/actions/export`
    const response = await api.request(context, 'GET', url)
    ux.action.stop()

    const fName = `${connection.app_name}-${connection.resource_name || ''}.json`

    ux.action.start('writing configuration to file')
    fs.writeFileSync(fName, JSON.stringify(response.data, null, 4))
    ux.action.stop(fName)
  }
}
