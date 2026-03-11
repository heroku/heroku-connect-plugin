import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import inquirer from 'inquirer'

async function fetchKeys (appName, context) {
  const url = `/api/v3/apps/${appName}`
  const response = await api.request(context, 'GET', url)
  const keys = []
  response.data.db_keys.forEach(function (key) {
    keys.push({
      name: `${key.name} (${key.addon.plan})`,
      value: key.name
    })
  })
  return keys
}

export default {
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
  run: cli.command(async function (context, heroku) {
    const data = {
      db_key: context.flags.db,
      schema_name: context.flags.schema
    }

    const connection = await api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
    context.region = connection.region_url

    const answers = await inquirer.prompt([
      {
        name: 'db_key',
        type: 'list',
        message: "Select the config var that points to the database you'd like to use",
        choices: await fetchKeys(connection.app_name, context),
        when: !context.flags.db
      },
      {
        name: 'schema_name',
        message: "Enter a schema name you'd like to use for the conneted data",
        default: context.flags.schema || 'salesforce',
        when: !context.flags.schema
      }
    ])

    for (const key in answers) {
      data[key] = answers[key]
    }

    await cli.action('setting database parameters', (async function () {
      const url = `/api/v3/kafka-connections/${connection.id}`
      await api.request(context, 'PUT', url, data)
    })())

    cli.styledHash(data)
  })
}
