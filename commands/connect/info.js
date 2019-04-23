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
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    let connections = yield api.withUserConnections(context, context.app, context.flags, true, heroku)

    if (connections.length === 0) {
      cli.error('No connection(s) found')
    } else {
      connections.forEach(function (connection) {
        api.connection_info(connection, true)
      })
    }
  }))
}
