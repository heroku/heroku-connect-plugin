import * as api from '../../../lib/connect/api.js'
import { Command, flags } from '@heroku-cli/command'
import { Args } from '@oclif/core'
import cli from '@heroku/heroku-cli-util'

export default class ConnectEventsStreamCreate extends Command {
  static description = 'Create a stream'

  static args = {
    stream: Args.string()
  }

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' })
  }

  async run () {
    const { args, flags } = await this.parse(ConnectEventsStreamCreate)
    const context = {
      app: flags.app,
      flags,
      args,
      auth: { password: this.heroku.auth }
    }

    await cli.action('creating stream', (async function () {
      const connection = await api.withConnection(context, this.heroku, api.ADDON_TYPE_EVENTS)
      context.region = connection.region_url
      const response = await api.request(
        context, 'POST', `/api/v3/kafka-connections/${connection.id}/streams`,
        { object_name: args.stream }
      )
      if (response.status !== 201) {
        throw new Error(response.data.message || 'unknown error')
      }
    }.bind(this))())
  }
}
