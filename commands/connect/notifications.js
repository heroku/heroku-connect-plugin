'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')

function formatDate (date) {
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

function truncateMessage (message, maxLength = 50) {
  if (!message) return ''
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength - 3) + '...'
}

module.exports = {
  topic: 'connect:notifications',
  description: 'return the unacknowledged notifications',
  help: 'return a list of unacknowledged notifications',
  flags: [
    { name: 'after', description: 'start date for notifications', hasValue: true },
    { name: 'before', description: 'end date for notifications', hasValue: true },
    { name: 'event-type', description: 'type of event to filter by', hasValue: true},
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    const connection = yield api.withConnection(context, heroku)
    context.region = connection.region_url

    const data = {
      page_size: 1000,
      after: context.flags.after,
      before: context.flags.before,
      event_type: context.flags['event-type'],
    }

    const response = yield api.request(context, 'GET', '/api/v3/connections/' + connection.id + '/notifications', data)
    if (response.data.results.length > 0) {
      cli.table(response.data.results, {
        columns: [
          { key: 'event_type', label: 'Event Type' },
          { key: 'message', label: 'Message', format: (message) => truncateMessage(message, 50) },
          { key: 'created_at', label: 'Created At (MM/DD/YYYY HH:MM AM/PM)', format: formatDate }
        ]
      })
    }
  }))
}
