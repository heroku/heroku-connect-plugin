exports.topics = [{
  name: 'connect',
  description: 'manage connections for heroku connect'
}];

exports.commands = [
  require('./lib/commands/connect/status'),
  require('./lib/commands/connect/create-mapping'),
  require('./lib/commands/connect/delete-mapping')
];
