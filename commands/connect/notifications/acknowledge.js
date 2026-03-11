import * as api from '../../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import { Command, flags } from '@heroku-cli/command'

export default class NotificationsAcknowledge extends Command {
  static description = 'Acknowledges notifications matching the given criteria'

  static flags = {
    app: flags.app({ required: true }),
    after: flags.string({ description: 'start date for notifications' }),
    before: flags.string({ description: 'end date for notifications' }),
    'event-type': flags.string({ description: 'type of event to filter by' }),
    resource: flags.string({ description: 'specific connection resource name' })
  }

  async run () {
    const { args, flags } = await this.parse(NotificationsAcknowledge)
    const context = { app: flags.app, flags, args, auth: { password: this.heroku.auth } }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url

    const params = {
      page_size: 1000,
      after: context.flags.after,
      before: context.flags.before,
      event_type: context.flags['event-type']
    }

    const response = await api.request(context, 'POST', '/api/v3/connections/' + connection.id + '/notifications/acknowledge', null, params)
    if (response.status !== 204) {
      throw new Error(response.data.message || 'unknown error')
    }
  }
}
