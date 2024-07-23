'use strict'
const cli = require('@heroku/heroku-cli-util')
const co = require('co')
const { ConnectClient } = require('../clients/connect')
const { DiscoveryClient } = require('../clients/discovery')

exports.ADDON_TYPE_SYNC = 1
exports.ADDON_TYPE_EVENTS = 2

const request = exports.request = function (context, method, url, data) {
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

const withUserConnections = exports.withUserConnections = co.wrap(function * (context, appName, flags, allowNone, heroku, addonType) {
  const connectClient = new ConnectClient(context)
  const discoveryClient = new DiscoveryClient(context)

  const searchResponse = yield discoveryClient.searchConnections(appName, context.flags.resource, addonType)
  const connections = searchResponse.data.results

  if (connections.length === 0) {
    return yield Promise.resolve([])
  }

  const fetchConnectionDetailFuncs = connections.map(function (c) {
    return co(function * () {
      const response = yield connectClient.getDetails(c)
      const mergedDetails = {
        ...c,
        ...response.data
      }
      return yield Promise.resolve(mergedDetails)
    })
  })

  const aggregatedConnectionsData = yield Promise.all(fetchConnectionDetailFuncs)
  return yield Promise.resolve(aggregatedConnectionsData)
})

const withConnection = exports.withConnection = function (context, heroku, addonType) {
  return co(function * () {
    const connectClient = new ConnectClient(context)
    const discoveryClient = new DiscoveryClient(context)

    const searchResponse = yield discoveryClient.searchConnections(context.app, context.flags.resource, addonType)
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

const withMapping = exports.withMapping = function (connection, objectName) {
  return co(function * () {
    const objectNameLower = objectName.toLowerCase()
    let mapping
    connection.mappings.forEach(function (m) {
      if (m.object_name.toLowerCase() === objectNameLower) {
        mapping = m
      }
    })
    if (mapping !== undefined) {
      return yield Promise.resolve(mapping)
    } else {
      throw new Error(`No mapping configured for ${objectName}`)
    }
  })
}

exports.withStream = function (context, connection, objectName) {
  return co(function * () {
    if (!connection.streams) {
      connection.streams = yield getStreams(context, connection)
    }
    const objectNameLower = objectName.toLowerCase()
    let stream
    connection.streams.forEach(function (s) {
      if (s.object_name.toLowerCase() === objectNameLower) {
        stream = s
      }
    })
    if (stream !== undefined) {
      return yield Promise.resolve(stream)
    } else {
      throw new Error(`No stream configured for ${objectName}`)
    }
  })
}

const getStreams = exports.getStreams = function (context, connection) {
  return co(function * () {
    const connectClient = new ConnectClient(context)
    const response = yield connectClient.request({
      baseURL: connection.region_url,
      method: 'GET',
      url: `${connection.detail_url}/streams`,
      data: null
    })
    const streams = response.data.results
    return yield Promise.resolve(streams)
  })
}

exports.withStreams = function (context, connections) {
  return co(function * () {
    const fetchConnectionStreams = connections.map(function (c) {
      return co(function * () {
        c.streams = yield getStreams(context, c)
        return yield Promise.resolve(c)
      })
    })
    const aggregatedConnectionsResponse = yield Promise.all(fetchConnectionStreams)
    return yield Promise.resolve(aggregatedConnectionsResponse)
  })
}

exports.requestAppAccess = function (context, app, flags, allowNone, heroku, addonType) {
  return co(function * () {
    const discoveryClient = new DiscoveryClient(context)
    const response = yield discoveryClient.requestAppAccess(app, addonType)
    yield Promise.resolve(response.json)
    return yield withUserConnections(context, app, flags, allowNone, heroku, addonType)
  })
}

exports.getWriteErrors = co.wrap(function * (context, heroku) {
  let url, action
  const mappingName = context.args.name
  const connection = yield withConnection(context, heroku)
  context.region = connection.region_url
  if (!mappingName) {
    url = `/api/v3/connections/${connection.id}/errors`
    action = `Retrieving write errors for ${connection.name}`
  } else {
    const mapping = yield withMapping(connection, mappingName)
    url = `/api/v3/mappings/${mapping.id}/errors`
    action = `Retrieving write errors for ${mappingName} on ${connection.name}`
  }
  const results = yield cli.action(action, co(function * () {
    return yield request(context, 'GET', url)
  }))
  const errors = results.data

  if (errors.count === 0) {
    cli.log(cli.color.green('No write errors in the last 24 hours'))
  } else {
    if (context.flags.json) {
      cli.styledJSON(errors.results)
    } else {
      cli.table(errors.results, {
        columns: [
          { key: 'id', label: 'Trigger Log ID' },
          { key: 'table_name', label: 'Table Name' },
          { key: 'record_id', label: 'Table ID' },
          { key: 'message', label: 'Error Message' },
          { key: 'created_at', label: 'Created' }
        ]
      })
    }
  }
})
