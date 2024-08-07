'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect-events',
  command: 'recover',
  aliases: ['connect:restart'],
  description: 'Recover a connection',
  help: 'Clears errors and attempts to resume sync operations',
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    yield cli.action('recovering connection', co(function * () {
      const connection = yield api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
      context.region = connection.region_url
      const url = `/api/v3/kafka-connections/${connection.id}/actions/recover`
      yield api.request(context, 'POST', url)
    }))
  }))
}
