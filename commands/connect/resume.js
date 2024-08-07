'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect',
  command: 'resume',
  description: 'Resume a connection',
  help: 'Resumes a paused connection',
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    cli.action('resuming connection', co(function * () {
      const connection = yield api.withConnection(context, heroku)
      context.region = connection.region_url
      const url = '/api/v3/connections/' + connection.id + '/actions/resume'
      yield api.request(context, 'POST', url)
    }))
  }))
}
