import * as api from '../../lib/connect/api.js'
import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'

export default class ConnectEventsInfo extends Command {
  static description = 'display connection information'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    'check-for-new': flags.boolean({ char: 'c', description: 'check for access to any new connections' })
  }

  async run () {
    const { flags } = await this.parse(ConnectEventsInfo)
    const context = {
      app: flags.app,
      flags,
      auth: { password: this.heroku.auth }
    }

    let connections

    if (flags['check-for-new']) {
      connections = await api.requestAppAccess(context, flags.app, flags, true, this.heroku, api.ADDON_TYPE_EVENTS)
    } else {
      connections = await api.withUserConnections(context, flags.app, flags, true, this.heroku, api.ADDON_TYPE_EVENTS)
      if (connections.length === 0) {
        connections = await api.requestAppAcess(context, flags.app, flags, true, this.heroku, api.ADDON_TYPE_EVENTS)
      }
    }

    if (connections.length === 0) {
      const instanceName = process.env.CONNECT_ADDON === 'connectqa' ? 'platformeventsqa' : 'herokuconnect'
      cli.error('No connection found. You may need to use addons:open to make it accessible to the CLI.')
      cli.error('')
      cli.error('For Example:')
      cli.error(`heroku addons:open ${instanceName} -a ${flags.app}`)
    } else {
      connections = await api.withStreams(context, connections)
      connections.forEach(function (connection) {
        cli.styledHeader(`Connection [${connection.id}] / ${connection.resource_name} (${connection.state})`)
        cli.log()
        if (connection.streams.length > 0) {
          cli.table(
            connection.streams, {
              columns: [
                { key: 'object_name', label: 'Object Name' },
                { key: 'state', label: 'State' }
              ]
            }
          )
        } else {
          cli.log('No streams')
        }
        cli.log()
      })
    }
  }
}
