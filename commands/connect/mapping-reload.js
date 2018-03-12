'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect:mapping',
  command: 'reload',
  description: "Reload a mapping's data from Salesforce",
  help: "Reload a mapping's data from Salesforce",
  args: [
    {name: 'mapping'}
  ],
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    context.region = yield regions.determineRegion(context, heroku)
    yield cli.action(`initiating reload of ${context.args.mapping}`, co(function * () {
      let connection = yield api.withConnection(context, heroku)
      let mapping = yield api.withMapping(connection, context.args.mapping)

      let response = yield api.request(context, 'POST', '/api/v3/mappings/' + mapping.id + '/actions/reload')
      if (response.statusCode !== 202) {
        throw new Error(response.json.message || 'unknown error')
      }
    }))
  }))
}
