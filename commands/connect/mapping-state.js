'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect:mapping',
  command: 'state',
  description: 'return a mapping state',
  help: 'return a mapping state',
  args: [
    {name: 'mapping'}
  ],
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    let connection = yield api.withConnection(context, heroku)
    context.region = connection.region_url
    let mapping = yield api.withMapping(connection, context.args.mapping)

    cli.log(mapping.state)
  }))
}
