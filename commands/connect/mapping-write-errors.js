'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const pg = require('heroku-pg')
const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  context.region = yield regions.determineRegion(context, heroku)
  let mappingName = context.args.name.toLowerCase()
  let connection = yield api.withConnection(context, heroku)
  let query = `
SELECT
  id, processed_at, record_id, sf_message, false AS archived
FROM
  ${connection.schema_name}._trigger_log
WHERE
  state = 'FAILED' AND table_name = '${mappingName}'
UNION
SELECT
  id, processed_at, record_id, sf_message, true AS archived
FROM
  ${connection.schema_name}._trigger_log_archive
WHERE
  state = 'FAILED' AND table_name = '${mappingName}'
ORDER BY
  processed_at DESC
`
  let fetcher = pg.fetcher(heroku)
  let db = yield fetcher.database(context.app, connection.db_key)

  let output = yield pg.psql.exec(db, query)
  cli.log(output)
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
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
