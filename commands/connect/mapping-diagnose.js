'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')
const diagnose = require('./diagnose')

module.exports = {
  topic: 'connect:mapping',
  command: 'diagnose',
  description: 'Display diagnostic information about a mapping',
  help: 'Checks a mapping for common configuration errors. ',
  args: [
    { name: 'mapping' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true },
    { name: 'verbose', char: 'v', description: 'display passed and skipped check information as well' }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    const connection = yield api.withConnection(context, heroku)
    context.region = connection.region_url
    const mapping = yield api.withMapping(connection, context.args.mapping)
    const results = yield cli.action('Diagnosing mapping', co(function * () {
      const url = '/api/v3/mappings/' + mapping.id + '/validations'
      return yield api.request(context, 'GET', url)
    }))
    cli.log() // Blank line to separate each section
    cli.styledHeader(mapping.object_name)
    diagnose.displayResults(results.data, context.flags)
  }))
}
