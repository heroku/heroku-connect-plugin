'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect-events:stream',
  command: 'state',
  description: 'return a stream state',
  help: 'return a stream state',
  args: [
    {name: 'stream'}
  ],
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    let connection = yield api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
    context.region = connection.region_url
    let stream = yield api.withStream(connection, context.args.stream)

    cli.log(stream.state)
  }))
}
