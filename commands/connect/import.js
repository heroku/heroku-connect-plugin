'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('heroku-cli-util')
const co = require('co')
const fs = require('fs')

module.exports = {
  topic: 'connect',
  command: 'import',
  description: 'Import configuration from an export file',
  help: 'Imports the mapping configuration from a json export file',
  args: [
    {name: 'file', desciption: 'JSON export file name'}
  ],
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    let fName = context.args.file
    yield cli.action(`uploading ${fName}`, co(function * () {
      let connection = yield api.withConnection(context, heroku)
      context.region = connection.region_url
      let url = '/api/v3/connections/' + connection.id + '/actions/import'
      let data = JSON.parse(fs.readFileSync(fName, 'utf8'))
      yield api.request(context, 'POST', url, data)
    }))
  }))
}
