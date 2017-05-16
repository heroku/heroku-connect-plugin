'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')
const fs = require('fs')

module.exports = {
  topic: 'connect',
  command: 'export',
  description: 'Export configuration from a connection',
  help: 'Exports the mapping configuration from a connection as a json file',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    context.region = regions.determineRegion(context)
    let connection, response

    yield cli.action('fetching configuration', co(function * () {
      connection = yield api.withConnection(context, heroku)
      let url = '/api/v3/connections/' + connection.id + '/actions/export'
      response = yield api.request(context, 'GET', url)
    }))

    let fName = connection.app_name + '-' + (connection.resource_name || '') + '.json'

    yield cli.action('writing configuration to file', {
      'success': fName
    }, co(function * () {
      fs.writeFileSync(fName, JSON.stringify(response.json, null, 4))
    }))
  }))
}
