'use strict';
exports.topics = [{
  name: 'connect',
  description: 'manage connections for Heroku Connect'
}];

exports.commands = [
  require('./lib/commands/connect/status'),
  require('./lib/commands/connect/state'),
  require('./lib/commands/connect/preauth'),
  require('./lib/commands/connect/auth_connection'),
  require('./lib/commands/connect/setup'),
  require('./lib/commands/connect/mapping'),
  require('./lib/commands/connect/import'),
  require('./lib/commands/connect/export'),
  require('./lib/commands/connect/pause'),
  require('./lib/commands/connect/resume'),
  require('./lib/commands/connect/restart'),
  require('./lib/commands/connect/create-mapping'),
  require('./lib/commands/connect/delete-mapping')
];
