import * as api from '../../lib/connect/api.js'
import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'

export default class ConnectEventsResume extends Command {
  static description = 'Resume a connection'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' })
  }

  async run () {
    const { flags } = await this.parse(ConnectEventsResume)
    const context = {
      app: flags.app,
      flags,
      auth: { password: this.heroku.auth }
    }

    await cli.action('resuming connection', (async function () {
      const connection = await api.withConnection(context, this.heroku, api.ADDON_TYPE_EVENTS)
      context.region = connection.region_url
      const url = `/api/v3/kafka-connections/${connection.id}/actions/resume`
      await api.request(context, 'POST', url)
    }.bind(this))())
  }
}
