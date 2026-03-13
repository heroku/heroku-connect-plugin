import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import * as api from '../../lib/connect/api.js'

export default class ConnectInfo extends Command {
  static description = 'display connection information'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    'check-for-new': flags.boolean({ char: 'c', description: 'check for access to any new connections' })
  }

  async run () {
    const { flags } = await this.parse(ConnectInfo)
    const context = {
      app: flags.app,
      flags,
      args: {},
      auth: { password: this.heroku.auth }
    }

    let connections
    if (flags['check-for-new']) {
      connections = await api.requestAppAccess(context, flags.app, flags, true, this.heroku)
    } else {
      connections = await api.withUserConnections(context, flags.app, flags, true, this.heroku)
      if (connections.length === 0) {
        connections = await api.requestAppAccess(context, flags.app, flags, true, this.heroku)
      }
    }

    if (connections.length === 0) {
      const instanceName = process.env.CONNECT_ADDON === 'connectqa' ? 'connectqa' : 'herokuconnect'
      cli.error('No connection found. You may need to use addons:open to make it accessible to the CLI.')
      cli.error('')
      cli.error('For Example:')
      cli.error(`heroku addons:open ${instanceName} -a ${flags.app}`)
    } else {
      connections.forEach(function (connection) {
        cli.styledHeader(`Connection [${connection.id}] / ${connection.resource_name} (${connection.state})`)
        cli.log()
        if (connection.mappings.length > 0) {
          cli.table(
            connection.mappings, {
              columns: [
                { key: 'object_name', label: 'Object Name' },
                { key: 'state', label: 'State' }
              ]
            }
          )
        } else {
          cli.log('No mappings')
        }
        cli.log()
      })
    }
  }
}
