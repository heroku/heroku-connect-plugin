'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect:mapping',
  command: 'delete',
  description: 'Delete an existing mapping',
  help: 'Delete an existing mapping',
  args: [
    { name: 'mapping' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true },
    { name: 'confirm', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    yield cli.confirmApp(context.app, context.flags.confirm)

    yield cli.action('deleting mapping', co(function * () {
      const connection = yield api.withConnection(context, heroku)
      context.region = connection.region_url
      const mapping = yield api.withMapping(connection, context.args.mapping)
      const response = yield api.request(context, 'DELETE', '/api/v3/mappings/' + mapping.id)
      if (response.status !== 204) {
        throw new Error(response.data.message || 'unknown error')
      }
    }))
  }))
}
