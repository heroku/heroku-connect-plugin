'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  context.region = yield regions.determineRegion(context, heroku)
  let mappingName = context.args.name
  let connection = yield api.withConnection(context, heroku)
  let mapping = yield api.withMapping(connection, mappingName)
  let results = yield cli.action('Retrieving errors', co(function * () {
    let url = '/api/v3/mappings/' + mapping.id + '/errors'
    return yield api.request(context, 'GET', url)
  }))
  let errors = results.json

  if (errors.count === 0) {
    cli.log('No write errors in the last 24 hours')
  } else {
    if (context.flags.json) {
      cli.styledJSON(errors.results)
    } else {
      cli.table(errors.results, {
        printHeader: true,
        columns: [
          {key: 'id', label: 'Trigger Log ID'},
          {key: 'table_name', label: 'Table Name'},
          {key: 'record_id', label: 'Table ID'},
          {key: 'message', label: 'Error Message'},
          {key: 'created_at', label: 'Created'}
        ]
      })
    }
  }
}

module.exports = {
  topic: 'connect',
  command: 'mapping:write-errors',
  description: 'Display the last 24 hours of write errors',
  args: [
    {
      name: 'name',
      optional: false,
      description: 'Name of the mapping to retrieve errors for'
    }
  ],
  flags: [
    {
      name: 'resource',
      description: 'specific connection resource name',
      hasValue: true
    },
    {
      name: 'json',
      description: 'print errors as styled JSON',
      hasValue: false
    },
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
