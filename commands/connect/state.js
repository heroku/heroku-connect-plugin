import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import * as api from '../../lib/connect/api.js'

export default class ConnectState extends Command {
  static description = 'return the connection(s) state'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    json: flags.boolean({ description: 'print output as json' })
  }

  async run () {
    const { flags } = await this.parse(ConnectState)
    const context = {
      app: flags.app,
      flags,
      args: {},
      auth: { password: this.heroku.auth }
    }

    const connections = await api.withUserConnections(context, flags.app, flags, this.heroku)

    if (flags.json) {
      cli.styledJSON(connections)
    } else {
      cli.table(connections, {
        columns: [
          { key: 'db_key', label: 'Database' },
          { key: 'schema_name', label: 'Schema' },
          { key: 'state', label: 'State' }
        ]
      })
    }
  }
}
