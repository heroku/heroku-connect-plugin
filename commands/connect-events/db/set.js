import * as api from '../../../lib/connect/api.js'
import { Command, flags } from '@heroku-cli/command'
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

export default class ConnectEventsDbSet extends Command {
  static description = 'Set database parameters'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    db: flags.string({ description: 'Database config var name' }),
    schema: flags.string({ description: 'Database schema name' })
  }

  async run () {
    const { flags } = await this.parse(ConnectEventsDbSet)
    const context = {
      app: flags.app,
      flags,
      auth: { password: this.heroku.auth }
    }

    const data = {
      db_key: flags.db,
      schema_name: flags.schema
    }

    const connection = await api.withConnection(context, this.heroku, api.ADDON_TYPE_EVENTS)
    context.region = connection.region_url

    const answers = await inquirer.prompt([
      {
        name: 'db_key',
        type: 'list',
        message: "Select the config var that points to the database you'd like to use",
        choices: await fetchKeys(connection.app_name, context),
        when: !flags.db
      },
      {
        name: 'schema_name',
        message: "Enter a schema name you'd like to use for the conneted data",
        default: flags.schema || 'salesforce',
        when: !flags.schema
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
  }
}
