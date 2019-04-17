'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect',
  command: 'recover',
  aliases: ['connect:restart'],
  description: 'Recover a connection',
  help: 'Clears errors and attempts to resume sync operations',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    yield cli.action('recovering connection', co(function * () {
      let connection = yield api.withConnection(context, heroku)
      context.region = connection.region_url
      let url = '/api/v3/connections/' + connection.id + '/actions/restart'
      yield api.request(context, 'POST', url)
    }))
  }))
}
