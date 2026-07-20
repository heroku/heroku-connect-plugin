import {Command, flags} from '@heroku-cli/command'
import {styledJSON, table} from '@heroku/heroku-cli-util/hux'

import {ConnectContext} from '../../lib/clients/connect.js'
import * as api from '../../lib/connect/api.js'

export default class ConnectState extends Command {
  static description = 'return the connection(s) state'
  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({description: 'print output as json'}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConnectState)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    const connections = await api.withUserConnections(context, flags.app, flags, undefined, this.heroku)

    if (flags.json) {
      styledJSON(connections)
      return
    }

    table(connections as unknown as Array<Record<string, unknown>>, {
      db_key: {header: 'Database'},
      schema_name: {header: 'Schema'},
      state: {header: 'State'},
    })
  }
}
