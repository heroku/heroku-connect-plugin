'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect',
  command: 'diagnose',
  description: 'Display diagnostic information about a connection',
  help: 'Checks a connection for common configuration errors. ',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    context.region = regions.determineRegion(context)
    let connection = yield api.withConnection(context, heroku)
    let results = yield cli.action('Diagnosing connection', co(function * () {
      let url = '/api/v3/connections/' + connection.id + '/diagnose'
      return yield api.request(context, 'GET', url)
    }))
  }))
}
