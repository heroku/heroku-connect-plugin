import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import * as api from '../../lib/connect/api.js'

export default class ConnectResume extends Command {
  static description = 'Resume a connection'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' })
  }

  async run () {
    const { flags } = await this.parse(ConnectResume)
    const context = {
      app: flags.app,
      flags,
      args: {},
      auth: { password: this.heroku.auth }
    }

    await cli.action('resuming connection', (async function () {
      const connection = await api.withConnection(context, this.heroku)
      context.region = connection.region_url
      const url = '/api/v3/connections/' + connection.id + '/actions/resume'
      await api.request(context, 'POST', url)
    }.bind(this))())
  }
}
