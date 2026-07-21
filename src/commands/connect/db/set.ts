import {Command, flags} from '@heroku-cli/command'
import {styledObject} from '@heroku/heroku-cli-util/hux'
import {ux} from '@oclif/core'
import inquirer from 'inquirer'

import {ConnectContext} from '../../../lib/clients/connect.js'
import * as api from '../../../lib/connect/api.js'

interface DbKey {
  addon?: null | {plan?: string}
  name: string
}

interface Choice {
  name: string
  value: string
}

async function fetchKeys(appName: string, context: ConnectContext): Promise<Choice[]> {
  const url = `/api/v3/apps/${appName}`
  const response = await api.request(context, 'GET', url)
  const keys: Choice[] = []
  const dbKeys = response.data.db_keys as DbKey[]
  for (const key of dbKeys) {
    const plan = (key.addon ? key.addon.plan : null) || 'Unknown Plan'
    keys.push({
      name: `${key.name} (${plan})`,
      value: key.name,
    })
  }

  return keys
}

export default class DbSet extends Command {
  static description = 'Set database parameters'
  static flags = {
    app: flags.app({required: true}),
    db: flags.string({description: 'Database config var name'}),
    resource: flags.string({description: 'specific connection resource name'}),
    schema: flags.string({description: 'Database schema name'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(DbSet)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    const data: Record<string, string | undefined> = {
      db_key: flags.db,
      schema_name: flags.schema,
    }

    const connection = await api.withConnection(context)
    context.region = connection.region_url

    const answers = await inquirer.prompt([
      {
        choices: await fetchKeys(connection.app_name as string, context),
        message: "Select the config var that points to the database you'd like to use",
        name: 'db_key',
        type: 'list',
        when: !flags.db,
      },
      {
        default: flags.schema || 'salesforce',
        message: "Enter a schema name you'd like to use for the connected data",
        name: 'schema_name',
        when: !flags.schema,
      },
    ])

    for (const key of Object.keys(answers)) {
      data[key] = (answers as Record<string, string>)[key]
    }

    ux.action.start('setting database parameters')
    const url = `/api/v3/connections/${connection.id}`
    await api.request(context, 'PATCH', url, data)
    ux.action.stop()

    ux.stdout(styledObject(data))
  }
}
