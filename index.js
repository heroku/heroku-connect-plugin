'use strict'
exports.topics = [{
  name: 'connect',
  description: 'manage connections for Heroku Connect'
}]

exports.commands = [
  require('./commands/connect/info'),
  require('./commands/connect/state'),
  require('./commands/connect/import'),
  require('./commands/connect/export'),
  require('./commands/connect/pause'),
  require('./commands/connect/resume'),
  require('./commands/connect/recover'),
  require('./commands/connect/sf-auth'),
  require('./commands/connect/db-set'),
  require('./commands/connect/diagnose'),
  require('./commands/connect/mapping-state'),
  require('./commands/connect/mapping-delete'),
  require('./commands/connect/mapping-reload'),
  require('./commands/connect/mapping-diagnose'),
  require('./commands/connect/mapping-write-errors')
]
