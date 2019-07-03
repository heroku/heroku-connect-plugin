'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect',
  command: 'info',
  default: false,
  description: 'display connection information',
  help: 'display connection information',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    {name: 'check-for-new', char: 'c', description: 'check for access to any new connections', hasValue: false}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    var connections
    if (context.flags['check-for-new']) {
      connections = yield api.requestAppAccess(context, context.app, context.flags, true, heroku)
    } else {
      connections = yield api.withUserConnections(context, context.app, context.flags, true, heroku)
      if (connections.length === 0) {
        connections = yield api.requestAppAccess(context, context.app, context.flags, true, heroku)
      }
    }

    if (connections.length === 0) {
      const instanceName = process.env['CONNECT_ADDON'] === 'connectqa' ? 'connectqa' : 'herokuconnect'
      cli.error('No connection found. You may need to use addons:open to make it accessible to the CLI.')
      cli.error('')
      cli.error('For Example:')
      cli.error(`heroku addons:open ${instanceName} -a ${context.app}`)
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
  }))
}
