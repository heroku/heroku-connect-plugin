'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect',
  command: 'pause',
  description: 'Pause a connection',
  help: 'Pauses an active connection',
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    yield cli.action('pausing connection', co(function * () {
      const connection = yield api.withConnection(context, heroku)
      context.region = connection.region_url
      const url = '/api/v3/connections/' + connection.id + '/actions/pause'
      yield api.request(context, 'POST', url)
    }))
  }))
}
