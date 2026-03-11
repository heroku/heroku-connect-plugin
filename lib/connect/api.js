import cli from '@heroku/heroku-cli-util'
import { ConnectClient } from '../clients/connect.js'
import { DiscoveryClient } from '../clients/discovery.js'

export const ADDON_TYPE_SYNC = 1
export const ADDON_TYPE_EVENTS = 2

export function request (context, method, url, data, params) {
  if (!context.region) {
    throw new Error('Must provide region URL')
  }
  const connectClient = new ConnectClient(context)
  return connectClient.request({
    baseURL: context.region,
    method,
    url,
    data,
    params
  })
}

export async function withUserConnections (context, appName, flags, allowNone, heroku, addonType) {
  const connectClient = new ConnectClient(context)
  const discoveryClient = new DiscoveryClient(context)

  const searchResponse = await discoveryClient.searchConnections(appName, context.flags.resource, addonType)
  const connections = searchResponse.data.results

  if (connections.length === 0) {
    return []
  }

  const fetchConnectionDetailFuncs = connections.map(async function (c) {
    const response = await connectClient.getDetails(c)
    return {
      ...c,
      ...response.data
    }
  })

  const aggregatedConnectionsData = await Promise.all(fetchConnectionDetailFuncs)
  return aggregatedConnectionsData
}

export async function withConnection (context, heroku, addonType) {
  const connectClient = new ConnectClient(context)
  const discoveryClient = new DiscoveryClient(context)

  const searchResponse = await discoveryClient.searchConnections(context.app, context.flags.resource, addonType)
  const connections = searchResponse.data.results

  if (connections.length === 0) {
    throw Error('No connection(s) found')
  } else if (connections.length > 1) {
    throw new Error("Multiple connections found. Please use '--resource' to specify a single connection by resource name. Use 'connect:info' to list the resource names.")
  } else {
    const match = connections[0]
    const matchDetailResponse = await connectClient.getDetails(match)
    return {
      ...match,
      ...matchDetailResponse.data
    }
  }
}

export async function withMapping (connection, objectName) {
  const objectNameLower = objectName.toLowerCase()
  let mapping
  connection.mappings.forEach(function (m) {
    if (m.object_name.toLowerCase() === objectNameLower) {
      mapping = m
    }
  })
  if (mapping !== undefined) {
    return mapping
  } else {
    throw new Error(`No mapping configured for ${objectName}`)
  }
}

export async function withStream (context, connection, objectName) {
  if (!connection.streams) {
    connection.streams = await getStreams(context, connection)
  }
  const objectNameLower = objectName.toLowerCase()
  let stream
  connection.streams.forEach(function (s) {
    if (s.object_name.toLowerCase() === objectNameLower) {
      stream = s
    }
  })
  if (stream !== undefined) {
    return stream
  } else {
    throw new Error(`No stream configured for ${objectName}`)
  }
}

export async function getStreams (context, connection) {
  const connectClient = new ConnectClient(context)
  const response = await connectClient.request({
    baseURL: connection.region_url,
    method: 'GET',
    url: `${connection.detail_url}/streams`,
    data: null
  })
  return response.data.results
}

export async function withStreams (context, connections) {
  const fetchConnectionStreams = connections.map(async function (c) {
    c.streams = await getStreams(context, c)
    return c
  })
  return await Promise.all(fetchConnectionStreams)
}

export async function requestAppAccess (context, app, flags, allowNone, heroku, addonType) {
  const discoveryClient = new DiscoveryClient(context)
  await discoveryClient.requestAppAccess(app, addonType)
  return await withUserConnections(context, app, flags, allowNone, heroku, addonType)
}

export async function getWriteErrors (context, heroku) {
  let url, action
  const mappingName = context.args.name
  const connection = await withConnection(context, heroku)
  context.region = connection.region_url
  if (!mappingName) {
    url = `/api/v3/connections/${connection.id}/errors`
    action = `Retrieving write errors for ${connection.name}`
  } else {
    const mapping = await withMapping(connection, mappingName)
    url = `/api/v3/mappings/${mapping.id}/errors`
    action = `Retrieving write errors for ${mappingName} on ${connection.name}`
  }
  const results = await cli.action(action, (async function () {
    return await request(context, 'GET', url)
  })())
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
}
