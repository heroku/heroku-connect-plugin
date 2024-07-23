'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')
const inquirer = require('inquirer')

const fetchKeys = co.wrap(function * (appName, context) {
  const url = `/api/v3/apps/${appName}`
  const response = yield api.request(context, 'GET', url)
  const keys = []// new Array(response.json.db_keys.length);
  response.data.db_keys.forEach(function (key) {
    keys.push({
      name: `${key.name} (${key.addon.plan})`,
      value: key.name
    })
  })
  return yield Promise.resolve(keys)
})

module.exports = {
  topic: 'connect-events',
  command: 'db:set',
  description: 'Set database parameters',
  help: "Set a connection's database config var and schema name",
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true },
    { name: 'db', description: 'Database config var name', hasValue: true },
    { name: 'schema', description: 'Database schema name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    const data = {
      db_key: context.flags.db,
      schema_name: context.flags.schema
    }

    const connection = yield api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
    context.region = connection.region_url

    inquirer.prompt([
      {
        name: 'db_key',
        type: 'list',
        message: "Select the config var that points to the database you'd like to use",
        choices: yield fetchKeys(connection.app_name, context),
        when: !context.flags.db
      },
      {
        name: 'schema_name',
        message: "Enter a schema name you'd like to use for the conneted data",
        default: context.flags.schema || 'salesforce',
        when: !context.flags.schema
      }
    ]).then(co.wrap(function * (answers) {
      for (const key in answers) {
        data[key] = answers[key]
      }

      yield cli.action('setting database parameters', co(function * () {
        const url = `/api/v3/kafka-connections/${connection.id}`
        yield api.request(context, 'PUT', url, data)
      }))

      cli.styledHash(data)
    }))
  }))
}
