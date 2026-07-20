import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import {ConnectContext} from '../../lib/clients/connect.js'
import * as api from '../../lib/connect/api.js'

export default class ConnectResume extends Command {
  static description = 'Resume a connection'
  static flags = {
    app: flags.app({required: true}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConnectResume)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    ux.action.start('resuming connection')
    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url
    const url = `/api/v3/connections/${connection.id}/actions/resume`
    await api.request(context, 'POST', url)
    ux.action.stop()
  }
}
