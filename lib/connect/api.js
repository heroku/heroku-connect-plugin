'use strict'
const cli = require('heroku-cli-util')
const co = require('co')
const { ConnectClient } = require('../clients/connect')
const { DiscoveryClient } = require('../clients/discovery')

let request = exports.request = function (context, method, url, data) {
  if (!context.region) {
    throw new Error('Must provide region URL')
  }
  const connectClient = new ConnectClient(context)
  return connectClient.request({
    baseURL: context.region,
    method,
    url,
    data
  })
}

exports.withUserConnections = co.wrap(function * (context, appName, flags, allowNone, heroku) {
  const connectClient = new ConnectClient(context)
  const discoveryClient = new DiscoveryClient(context)

  const searchResponse = yield discoveryClient.searchConnections(appName, context.flags.resource)
  const connections = searchResponse.data.results

  if (connections.length === 0) {
    return yield Promise.resolve([])
  }

  const fetchConnectionDetailFuncs = connections.map(c => connectClient.getDetails(c))

  const aggregatedConnectionsResponse = yield Promise.all(fetchConnectionDetailFuncs)
  const aggregatedConnectionsData = aggregatedConnectionsResponse.map(resp => resp.data)
  return yield Promise.resolve(aggregatedConnectionsData)
})

let withConnection = exports.withConnection = function (context, heroku) {
  return co(function * () {
    const connectClient = new ConnectClient(context)
    const discoveryClient = new DiscoveryClient(context)

    const searchResponse = yield discoveryClient.searchConnections(context.app, context.flags.resource)
    const connections = searchResponse.data.results

    if (connections.length === 0) {
      yield Promise.reject(Error('No connection(s) found'))
    } else if (connections.length > 1) {
      throw new Error("Multiple connections found. Please use '--resource' to specify a single connection by resource name. Use 'connect:info' to list the resource names.")
    } else {
      const match = connections[0]
      const matchDetailResponse = yield connectClient.getDetails(match)
      const matchWithDetails = {
        ...match,
        ...matchDetailResponse.data
      }
      return yield Promise.resolve(matchWithDetails)
    }
  })
}

let withMapping = exports.withMapping = function (connection, objectName) {
  return co(function * () {
    let objectNameLower = objectName.toLowerCase()
    let mapping
    connection.mappings.forEach(function (m) {
      if (m.object_name.toLowerCase().indexOf(objectNameLower) === 0) {
        mapping = m
      }
    })
    if (mapping !== undefined) {
      return yield Promise.resolve(mapping)
    } else {
      throw new Error('No mapping configured for ' + objectName)
    }
  })
}

exports.getWriteErrors = co.wrap(function * (context, heroku) {
  let url, action
  let mappingName = context.args.name
  let connection = yield withConnection(context, heroku)
  context.region = connection.region_url
  if (!mappingName) {
    url = `/api/v3/connections/${connection.id}/errors`
    action = `Retrieving write errors for ${connection.name}`
  } else {
    let mapping = yield withMapping(connection, mappingName)
    url = `/api/v3/mappings/${mapping.id}/errors`
    action = `Retrieving write errors for ${mappingName} on ${connection.name}`
  }
  let results = yield cli.action(action, co(function * () {
    return yield request(context, 'GET', url)
  }))
  let errors = results.data

  if (errors.count === 0) {
    cli.log(cli.color.green('No write errors in the last 24 hours'))
  } else {
    if (context.flags.json) {
      cli.styledJSON(errors.results)
    } else {
      cli.table(errors.results, {
        columns: [
          {key: 'id', label: 'Trigger Log ID'},
          {key: 'table_name', label: 'Table Name'},
          {key: 'record_id', label: 'Table ID'},
          {key: 'message', label: 'Error Message'},
          {key: 'created_at', label: 'Created'}
        ]
      })
    }
  }
})

exports.connection_string = function (conn) {
  return 'Connection [' + conn.id + ' / ' + conn.resource_name + ']'
}

exports.connection_info = function (conn, showMappings) {
  if (conn.length) {
    for (let i = 0; i < conn.length; i++) {
      exports.connection_info(conn[i], showMappings)
    }
    return
  }
  cli.log(exports.connection_string(conn) + ' (' + conn.state + ')')
  if (showMappings) {
    conn.mappings.forEach(function (mapping) {
      cli.log('--> ' + mapping.object_name + ' (' + mapping.state + ')')
    })
  }
  cli.log('') // newline after each connection
}
