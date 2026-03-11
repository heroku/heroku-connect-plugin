import * as api from '../../lib/connect/api.js'
import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'

async function run (context, heroku) {
  const connections = await api.withUserConnections(context, context.app, context.flags, heroku, true, api.ADDON_TYPE_EVENTS)

  if (context.flags.json) {
    cli.styledJSON(connections)
  } else {
    cli.table(connections, {
      columns: [
        { key: 'db_key', label: 'Kafka' },
        { key: 'schema_name', label: 'Schema' },
        { key: 'state', label: 'State' }
      ]
    })
  }
}

export default class ConnectEventsState extends Command {
  static description = 'return the connection(s) state'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    json: flags.boolean({ description: 'print output as json' })
  }

  async run () {
    const { flags } = await this.parse(ConnectEventsState)
    const context = {
      app: flags.app,
      flags,
      auth: { password: this.heroku.auth }
    }

    await run(context, this.heroku)
  }
}
