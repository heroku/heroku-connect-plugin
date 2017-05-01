'use strict'
const api = require('./shared.js')
const regions = require('./regions.js')
const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  context.region = regions.determineRegion(context)
  let connections = yield api.withUserConnections(context, context.app, context.flags, heroku)

  connections.forEach(function (connection) {
    console.log('Foo')
    cli.log(connection.state)
  })
}

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
  run: cli.command(co.wrap(run))
}
