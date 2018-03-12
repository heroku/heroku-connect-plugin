'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')
const diagnose = require('./diagnose')

module.exports = {
  topic: 'connect:mapping',
  command: 'diagnose',
  description: 'Display diagnostic information about a mapping',
  help: 'Checks a mapping for common configuration errors. ',
  args: [
    {name: 'mapping'}
  ],
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    {name: 'verbose', char: 'v', description: 'display passed and skipped check information as well'},
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    context.region = yield regions.determineRegion(context, heroku)
    let connection = yield api.withConnection(context, heroku)
    let mapping = yield api.withMapping(connection, context.args.mapping)
    let results = yield cli.action('Diagnosing mapping', co(function * () {
      let url = '/api/v3/mappings/' + mapping.id + '/validations'
      return yield api.request(context, 'GET', url)
    }))

    cli.log() // Blank line to separate each section
    cli.styledHeader(mapping.object_name)
    diagnose.displayResults(results.json, context.flags)
  }))
}
