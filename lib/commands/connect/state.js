'use strict'
let api = require('./shared.js')
let regions = require('./regions.js')
let cli = require('heroku-cli-util')
let co = require('co')

module.exports = {
  topic: 'connect',
  command: 'state',
  description: 'return the connection(s) state',
  help: 'returns the state key of the selected connections',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    context.region = regions.determineRegion(context)
    let connections = yield api.withUserConnections(context, context.app, context.flags, heroku)

    connections.forEach(function (connection) {
      console.log(connection.state)
    })
  }))
}
