'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')
const { formatDate, truncateMessage } = require('./notifications.js')

module.exports = {
  topic: 'connect:notifications',
  command: 'acknowledge',
  description: 'Acknowledges notifications matching the given criteria',
  help: 'Finds and acknowledges notifications matching the given criteria',
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

    const params = {
      page_size: 1000,
      after: context.flags.after,
      before: context.flags.before,
      event_type: context.flags['event-type'],
    }

    const response = yield api.request(context, 'POST', '/api/v3/connections/' + connection.id + '/notifications/acknowledge', null, params)
    if (response.status !== 204) {
      throw new Error(response.data.message || 'unknown error')
    }
  }))
}
