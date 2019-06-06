'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect-events',
  command: 'pause',
  description: 'Pause a connection',
  help: 'Pauses an active connection',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    yield cli.action('pausing connection', co(function * () {
      let connection = yield api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
      context.region = connection.region_url
      let url = '/api/v3/kafka-connections/' + connection.id + '/actions/pause'
      yield api.request(context, 'POST', url)
    }))
  }))
}
