'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')
const fs = require('fs')

module.exports = {
  topic: 'connect',
  command: 'export',
  description: 'Export configuration from a connection',
  help: 'Exports the mapping configuration from a connection as a json file',
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    let connection, response

    yield cli.action('fetching configuration', co(function * () {
      connection = yield api.withConnection(context, heroku)
      context.region = connection.region_url
      const url = '/api/v3/connections/' + connection.id + '/actions/export'
      response = yield api.request(context, 'GET', url)
    }))

    const fName = connection.app_name + '-' + (connection.resource_name || '') + '.json'

    yield cli.action('writing configuration to file', {
      success: fName
    }, co(function * () {
      fs.writeFileSync(fName, JSON.stringify(response.data, null, 4))
    }))
  }))
}
