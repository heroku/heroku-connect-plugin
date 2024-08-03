'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')

function isFloat(value) {
    return !isNaN(value) && parseFloat(value) == value && !Number.isInteger(parseFloat(value));
  }

module.exports = {
    topic: 'connect',
    command: 'schema-diff',
    description: 'compares the version of schema of mappings in a connection ',
    help: 'compares the schema of mappings in a connection based on connection.api_version and a target_version, then returns possible differences between the two',
    args: [
        { name: 'target_version', required: false, description: 'The target api version to compare schema\'s with ' }
      ], 
    needsApp: true,
    needsAuth: true,
    run: cli.command(co.wrap(function * (context, heroku) {
      let connection, url
      connection = yield api.withConnection(context, heroku)
      url = '/api/v3/connections/' + connection.id + '/schema-diff'

      if (context.args.target_version) {
        const target_version = context.args.target_version;

      if (!isFloat(target_version)) {
        console.error('The provided argument is not a valid float number');
        process.exit(1);
      }
      
      url += `?target_version=${target_version}`;
      }




     const results = yield cli.action('comparing schemas', co(function * () {
        
        context.region = connection.region_url
        
        const response = yield api.request(context, 'GET', url)
        if (response.status === 200) {
            return response.data
          } else {
            cli.error(err);
          }
      }))

      cli.log() // Blank line to separate each section
      cli.styledHeader(`Connection: ${connection.name || connection.internal_name}`)
      cli.log("Current API Version: "+ results["current_api_version"])
      cli.log("Target API Version: "+ results["target_api_version"])
      cli.log()
    cli.table(results["mappings"], {
        columns: [
          { key: "name", label: 'Object Name'},
          { key: "result_message", label: 'Schema Difference Output'},
          { key: "fields_have_changed", label: 'Fields Have Changed' , format: changed => changed ? cli.color.yellow('true') : cli.color.green('false') },
        ]
      });
      cli.log() // Blank line to separate each section

    



    }))
  }
