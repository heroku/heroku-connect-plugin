import {Command, flags} from '@heroku-cli/command'

import {ConnectContext} from '../../../lib/clients/connect.js'
import * as api from '../../../lib/connect/api.js'

export default class NotificationsAcknowledge extends Command {
  static description = 'Acknowledges notifications matching the given criteria'
  static flags = {
    after: flags.string({description: 'start date for notifications'}),
    app: flags.app({required: true}),
    before: flags.string({description: 'end date for notifications'}),
    'event-type': flags.string({description: 'type of event to filter by'}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(NotificationsAcknowledge)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url

    const params = {
      after: context.flags.after,
      before: context.flags.before,
      event_type: context.flags['event-type'],
      page_size: 1000,
    }

    const response = await api.request(
      context,
      'POST',
      `/api/v3/connections/${connection.id}/notifications/acknowledge`,
      null,
      params,
    )
    if (response.status !== 204) {
      throw new Error(response.data.message || 'unknown error')
    }
  }
}
