import {Command, flags} from '@heroku-cli/command'
import {styledHeader, table} from '@heroku/heroku-cli-util/hux'
import {ux} from '@oclif/core'

import {ConnectContext} from '../../lib/clients/connect.js'
import * as api from '../../lib/connect/api.js'

export default class ConnectInfo extends Command {
  static description = 'display connection information'
  static flags = {
    app: flags.app({required: true}),
    'check-for-new': flags.boolean({char: 'c', description: 'check for access to any new connections'}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConnectInfo)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    let connections: api.Connection[]
    if (flags['check-for-new']) {
      connections = await api.requestAppAccess(context, flags.app)
    } else {
      connections = await api.withUserConnections(context, flags.app)
      if (connections.length === 0) {
        connections = await api.requestAppAccess(context, flags.app)
      }
    }

    if (connections.length === 0) {
      const instanceName = process.env.CONNECT_ADDON === 'connectqa' ? 'connectqa' : 'herokuconnect'
      ux.stderr('No connection found. You may need to use addons:open to make it accessible to the CLI.')
      ux.stderr('')
      ux.stderr('For Example:')
      ux.stderr(`heroku addons:open ${instanceName} -a ${flags.app}`)
      return
    }

    for (const connection of connections) {
      styledHeader(`Connection [${connection.id}] / ${connection.resource_name} (${connection.state})`)
      ux.stdout()
      if (connection.mappings.length > 0) {
        table(connection.mappings, {
          object_name: {header: 'Object Name'},
          state: {header: 'State'},
        })
      } else {
        ux.stdout('No mappings')
      }

      ux.stdout()
    }
  }
}
