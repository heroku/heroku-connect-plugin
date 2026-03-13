import { Command, flags } from '@heroku-cli/command'
import * as api from '../../lib/connect/api.js'

export default class ConnectWriteErrors extends Command {
  static description = 'Display the last 24 hours of write errors on this connection'

  static examples = [
    '$ heroku connect:write-errors -a myapp --resource herokuconnect-twisted-123'
  ]

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    json: flags.boolean({ description: 'print errors as styled JSON' })
  }

  async run () {
    const { flags } = await this.parse(ConnectWriteErrors)
    const context = {
      app: flags.app,
      flags,
      args: {},
      auth: { password: this.heroku.auth }
    }

    await api.getWriteErrors(context, this.heroku)
  }
}
