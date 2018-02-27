'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  context.region = yield regions.determineRegion(context, heroku)
  let connections = yield api.withUserConnections(context, context.app, context.flags, heroku)

  if (!context.flags.resource) {
    if (context.flags.json) {
      cli.styledJSON(connections)
    } else {
      cli.table(connections, {
        columns: [
          {key: 'app_name', label: 'App'},
          {key: 'db_key', label: 'Database'},
          {key: 'schema_name', label: 'Schema'},
          {key: 'state', label: 'State'}
        ]
      })
    }
  } else {
    // Retrieving a single resource
    connections.forEach(function (connection) {
      cli.log(connection.state)
    })
  }
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
