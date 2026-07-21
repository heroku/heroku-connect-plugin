import {Command, flags} from '@heroku-cli/command'
import {table} from '@heroku/heroku-cli-util/hux'

import {ConnectContext} from '../../../lib/clients/connect.js'
import * as api from '../../../lib/connect/api.js'

export function formatDate(date?: Date | null | string): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function truncateMessage(message?: null | string, maxLength = 50): string {
  if (!message) return ''
  if (message.length <= maxLength) return message
  return message.slice(0, maxLength - 3) + '...'
}

export default class Notifications extends Command {
  static description = 'Return the unacknowledged notifications'
  static flags = {
    after: flags.string({description: 'start date for notifications'}),
    app: flags.app({required: true}),
    before: flags.string({description: 'end date for notifications'}),
    'event-type': flags.string({description: 'type of event to filter by'}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Notifications)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    const connection = await api.withConnection(context)
    context.region = connection.region_url

    const params = {
      after: context.flags.after,
      before: context.flags.before,
      event_type: context.flags['event-type'],
      page_size: 1000,
    }

    const response = await api.request(
      context,
      'GET',
      `/api/v3/connections/${connection.id}/notifications`,
      null,
      params,
    )

    const rows = (response.data.results as Array<Record<string, unknown>>).map(row => ({
      created_at: formatDate(row.created_at as string),
      event_type: row.event_type,
      message: truncateMessage(row.message as string, 50),
    }))

    table(rows, {
      created_at: {header: 'Created At (MM/DD/YYYY HH:MM AM/PM)'},
      event_type: {header: 'Event Type'},
      message: {header: 'Message'},
    }, {maxWidth: 'none'})
  }
}
