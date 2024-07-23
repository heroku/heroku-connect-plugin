'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect-events',
  command: 'info',
  default: false,
  description: 'display connection information',
  help: 'display connection information',
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true },
    { name: 'check-for-new', char: 'c', description: 'check for access to any new connections', hasValue: false }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    let connections

    if (context.flags['check-for-new']) {
      connections = yield api.requestAppAccess(context, context.app, context.flags, true, heroku, api.ADDON_TYPE_EVENTS)
    } else {
      connections = yield api.withUserConnections(context, context.app, context.flags, true, heroku, api.ADDON_TYPE_EVENTS)
      if (connections.length === 0) {
        connections = yield api.requestAppAcess(context, context.app, context.flags, true, heroku, api.ADDON_TYPE_EVENTS)
      }
    }

    if (connections.length === 0) {
      const instanceName = process.env.CONNECT_ADDON === 'connectqa' ? 'platformeventsqa' : 'herokuconnect'
      cli.error('No connection found. You may need to use addons:open to make it accessible to the CLI.')
      cli.error('')
      cli.error('For Example:')
      cli.error(`heroku addons:open ${instanceName} -a ${context.app}`)
    } else {
      connections = yield api.withStreams(context, connections)
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
  }))
}
