'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect',
  command: 'resume',
  description: 'Resume a connection',
  help: 'Resumes a paused connection',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    cli.action('resuming connection', co(function * () {
      let connection = yield api.withConnection(context, heroku)
      context.region = connection.region_url
      let url = '/api/v3/connections/' + connection.id + '/actions/resume'
      yield api.request(context, 'POST', url)
    }))
  }))
}
