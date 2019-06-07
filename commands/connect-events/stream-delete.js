'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('heroku-cli-util')
const co = require('co')

module.exports = {
  topic: 'connect-events:stream',
  command: 'delete',
  description: 'Delete an existing stream',
  help: 'Delete an existing stream',
  args: [
    {name: 'stream'}
  ],
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    {name: 'confirm', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    yield cli.confirmApp(context.app, context.flags.confirm)

    yield cli.action('deleting stream', co(function * () {
      let connection = yield api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
      context.region = connection.region_url
      let stream = yield api.withStream(connection, context.args.stream)
      let response = yield api.request(context, 'DELETE', `/api/v3/streams/${stream.id}`)
      if (response.status !== 204) {
        throw new Error(response.data.message || 'unknown error')
      }
    }))
  }))
}
