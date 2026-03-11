import * as api from '../../../lib/connect/api.js'
import { Command, flags } from '@heroku-cli/command'
import { Args } from '@oclif/core'
import cli from '@heroku/heroku-cli-util'

export default class ConnectEventsStreamDelete extends Command {
  static description = 'Delete an existing stream'

  static args = {
    stream: Args.string()
  }

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    confirm: flags.string()
  }

  async run () {
    const { args, flags } = await this.parse(ConnectEventsStreamDelete)
    const context = {
      app: flags.app,
      flags,
      args,
      auth: { password: this.heroku.auth }
    }

    await cli.confirmApp(flags.app, flags.confirm)

    await cli.action('deleting stream', (async function () {
      const connection = await api.withConnection(context, this.heroku, api.ADDON_TYPE_EVENTS)
      context.region = connection.region_url
      const stream = await api.withStream(context, connection, args.stream)
      const response = await api.request(context, 'DELETE', `/api/v3/streams/${stream.id}`)
      if (response.status !== 204) {
        throw new Error(response.data.message || 'unknown error')
      }
    }.bind(this))())
  }
}
