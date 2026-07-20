import {Command, flags} from '@heroku-cli/command'

import {ConnectContext} from '../../lib/clients/connect.js'
import * as api from '../../lib/connect/api.js'

export default class ConnectWriteErrors extends Command {
  static description = 'Display the last 24 hours of write errors on this connection'
  static examples = [
    '$ heroku connect:write-errors -a myapp --resource herokuconnect-twisted-123',
  ]
  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({description: 'print errors as styled JSON'}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConnectWriteErrors)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    await api.getWriteErrors(context, this.heroku)
  }
}
