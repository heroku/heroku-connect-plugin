'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect:mapping',
  command: 'reload',
  description: "Reload a mapping's data from Salesforce",
  help: "Reload a mapping's data from Salesforce",
  args: [
    { name: 'mapping' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    yield cli.action(`initiating reload of ${context.args.mapping}`, co(function * () {
      const connection = yield api.withConnection(context, heroku)
      context.region = connection.region_url
      const mapping = yield api.withMapping(connection, context.args.mapping)

      const response = yield api.request(context, 'POST', '/api/v3/mappings/' + mapping.id + '/actions/reload')
      if (response.status !== 202) {
        throw new Error(response.data.message || 'unknown error')
      }
    }))
  }))
}
