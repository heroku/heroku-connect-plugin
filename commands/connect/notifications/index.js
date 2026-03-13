import * as api from '../../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import { Command, flags } from '@heroku-cli/command'

export function formatDate (date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function truncateMessage (message, maxLength = 50) {
  if (!message) return ''
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength - 3) + '...'
}

export default class Notifications extends Command {
  static description = 'Return the unacknowledged notifications'

  static flags = {
    app: flags.app({ required: true }),
    after: flags.string({ description: 'start date for notifications' }),
    before: flags.string({ description: 'end date for notifications' }),
    'event-type': flags.string({ description: 'type of event to filter by' }),
    resource: flags.string({ description: 'specific connection resource name' })
  }

  async run () {
    const { args, flags } = await this.parse(Notifications)
    const context = { app: flags.app, flags, args, auth: { password: this.heroku.auth } }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url

    const params = {
      page_size: 1000,
      after: context.flags.after,
      before: context.flags.before,
      event_type: context.flags['event-type']
    }

    const response = await api.request(context, 'GET', '/api/v3/connections/' + connection.id + '/notifications', null, params)
    cli.table(response.data.results, {
      columns: [
        { key: 'event_type', label: 'Event Type' },
        { key: 'message', label: 'Message', format: (message) => truncateMessage(message, 50) },
        { key: 'created_at', label: 'Created At (MM/DD/YYYY HH:MM AM/PM)', format: formatDate }
      ]
    })
  }
}
