'use strict';
exports.topics = [{
  name: 'connect',
  description: 'manage connections for heroku connect'
}];

exports.commands = [
  require('./lib/commands/connect/status'),
  require('./lib/commands/connect/state'),
  require('./lib/commands/connect/preauth'),
  require('./lib/commands/connect/setup'),
  require('./lib/commands/connect/mapping'),
  require('./lib/commands/connect/create-mapping'),
  require('./lib/commands/connect/delete-mapping')
];
