import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import {ConnectContext} from '../../lib/clients/connect.js'
import * as api from '../../lib/connect/api.js'

export default class ConnectPause extends Command {
  static description = 'Pause a connection'
  static flags = {
    app: flags.app({required: true}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConnectPause)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    ux.action.start('pausing connection')
    const connection = await api.withConnection(context)
    context.region = connection.region_url
    const url = `/api/v3/connections/${connection.id}/actions/pause`
    await api.request(context, 'POST', url)
    ux.action.stop()
  }
}
