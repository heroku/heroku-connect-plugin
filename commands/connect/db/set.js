import * as api from '../../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import inquirer from 'inquirer'
import { Command, flags } from '@heroku-cli/command'

async function fetchKeys (appName, context) {
  const url = '/api/v3/apps/' + appName
  const response = await api.request(context, 'GET', url)
  const keys = []// new Array(response.json.db_keys.length);
  response.data.db_keys.forEach(function (key) {
    const plan = (key.addon ? key.addon.plan : null) || 'Unknown Plan'
    keys.push({
      name: `${key.name} (${plan})`,
      value: key.name
    })
  })
  return keys
}

export default class DbSet extends Command {
  static description = 'Set database parameters'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    db: flags.string({ description: 'Database config var name' }),
    schema: flags.string({ description: 'Database schema name' })
  }

  async run () {
    const { args, flags } = await this.parse(DbSet)
    const context = { app: flags.app, flags, args, auth: { password: this.heroku.auth } }

    const data = {
      db_key: context.flags.db,
      schema_name: context.flags.schema
    }

    const connection = await api.withConnection(context, this.heroku)
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
      const url = '/api/v3/connections/' + connection.id
      await api.request(context, 'PATCH', url, data)
    })())

    cli.styledHash(data)
  }
}
