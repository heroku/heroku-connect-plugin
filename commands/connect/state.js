'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  let connections = yield api.withUserConnections(context, context.app, context.flags, heroku)

  if (context.flags.json) {
    cli.styledJSON(connections)
  } else {
    cli.table(connections, {
      columns: [
        {key: 'db_key', label: 'Database'},
        {key: 'schema_name', label: 'Schema'},
        {key: 'state', label: 'State'}
      ]
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
    {name: 'json', description: 'print output as json', hasValue: false}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
