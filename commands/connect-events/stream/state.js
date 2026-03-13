import * as api from '../../../lib/connect/api.js'
import { Command, flags } from '@heroku-cli/command'
import { Args } from '@oclif/core'
import cli from '@heroku/heroku-cli-util'

export default class ConnectEventsStreamState extends Command {
  static description = 'return a stream state'

  static args = {
    stream: Args.string()
  }

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' })
  }

  async run () {
    const { args, flags } = await this.parse(ConnectEventsStreamState)
    const context = {
      app: flags.app,
      flags,
      args,
      auth: { password: this.heroku.auth }
    }

    const connection = await api.withConnection(context, this.heroku, api.ADDON_TYPE_EVENTS)
    context.region = connection.region_url
    const stream = await api.withStream(context, connection, args.stream)

    cli.log(stream.state)
  }
}
