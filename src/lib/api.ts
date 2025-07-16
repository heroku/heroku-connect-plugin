import {color} from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import {getDetails} from './connect'
import * as Discovery from './discovery'
import {
  AddonType,
  ConnectionWithDetails,
  Mapping,
  Stream,
  WriteErrorsResponse,
} from './types'

export async function withUserConnections(heroku: APIClient, appName: string, resourceName?: string, addonType?: AddonType): Promise<ConnectionWithDetails[]> {
  const {body: searchResponse} = await Discovery.searchConnections(heroku, appName, resourceName, addonType)
  const connections = searchResponse.results

  if (connections.length === 0) {
    return []
  }

  const fetchConnectionDetailFuncs = connections.map(async connection => {
    const {body: response} = await getDetails(heroku, connection)
    const mergedDetails: ConnectionWithDetails = {
      ...connection,
      ...response,
    }

    return mergedDetails
  })

  const aggregatedConnectionsData: ConnectionWithDetails[] = await Promise.all(fetchConnectionDetailFuncs)
  return aggregatedConnectionsData
}

export async function withConnection(heroku: APIClient, appName: string, resourceName?: string, addonType?: AddonType): Promise<ConnectionWithDetails> {
  const {body: searchResponse} = await Discovery.searchConnections(heroku, appName, resourceName, addonType)
  const connections = searchResponse.results

  if (connections.length === 0) {
    throw new Error('No connection(s) found')
  } else if (connections.length > 1) {
    throw new Error("Multiple connections found. Please use '--resource' to specify a single connection by resource name. Use 'connect:info' to list the resource names.")
  } else {
    const match = connections[0]
    const {body: matchDetailResponse} = await getDetails(heroku, match)
    const matchWithDetails: ConnectionWithDetails = {
      ...match,
      ...matchDetailResponse,
    }

    return matchWithDetails
  }
}

export async function withMapping(connection: ConnectionWithDetails, objectName: string): Promise<Mapping> {
  const objectNameLower = objectName.toLowerCase()
  let mapping: Mapping | undefined
  connection.mappings.forEach((m: Mapping) => {
    if (m.object_name.toLowerCase() === objectNameLower) {
      mapping = m
    }
  })
  if (mapping !== undefined) {
    return mapping
  }

  throw new Error(`No mapping configured for ${objectName}`)
}

export async function withStream(heroku: APIClient, connection: ConnectionWithDetails, objectName: string): Promise<Stream> {
  if (!connection.streams) {
    connection.streams = await getStreams(heroku, connection)
  }

  const objectNameLower = objectName.toLowerCase()
  let stream: Stream | undefined
  connection.streams.forEach((s: Stream) => {
    if (s.object_name.toLowerCase() === objectNameLower) {
      stream = s
    }
  })
  if (stream !== undefined) {
    return stream
  }

  throw new Error(`No stream configured for ${objectName}`)
}

async function getStreams(heroku: APIClient, connection: ConnectionWithDetails): Promise<Stream[]> {
  const detail_url = new URL(connection.detail_url)
  const {body: streams} = await heroku.get<Stream[]>(`${detail_url.pathname}/streams`, {
    hostname: detail_url.hostname,
    headers: {
      Accept: 'application/json',
      'Heroku-Client': 'cli',
    },
  })
  return streams
}

export async function withStreams(heroku: APIClient, connections: ConnectionWithDetails[]): Promise<ConnectionWithDetails[]> {
  const fetchConnectionStreams = connections.map(async c => {
    c.streams = await getStreams(heroku, c)
    return c
  })
  const aggregatedConnectionsResponse = await Promise.all(fetchConnectionStreams)
  return aggregatedConnectionsResponse
}

export async function requestAppAccess(heroku: APIClient, appName: string, addonType?: AddonType): Promise<void> {
  await Discovery.requestAppAccess(heroku, appName, addonType)
  await withUserConnections(heroku, appName, undefined, addonType)
}

export async function getWriteErrors(heroku: APIClient, connection: ConnectionWithDetails, mappingName?: string, json?: boolean): Promise<void> {
  let url: string
  let action: string
  if (mappingName) {
    const mapping = await withMapping(connection, mappingName)
    url = `/api/v3/mappings/${mapping.id}/errors`
    action = `Retrieving write errors for ${mappingName} on ${connection.name}`
  } else {
    url = `/api/v3/connections/${connection.id}/errors`
    action = `Retrieving write errors for ${connection.name}`
  }

  ux.action.start(action)
  const {body: errors} = await heroku.get<WriteErrorsResponse>(url, {
    hostname: new URL(connection.region_url).hostname,
    headers: {
      Accept: 'application/json',
      'Heroku-Client': 'cli',
    },
  })
  ux.action.stop()

  if (errors.count === 0) {
    ux.log(color.green('No write errors in the last 24 hours'))
  } else if (json) {
    ux.styledJSON(errors.results)
  } else {
    ux.table(errors.results, {
      id: {header: 'Trigger Log ID'},
      table_name: {header: 'Table Name'},
      record_id: {header: 'Table ID'},
      message: {header: 'Error Message'},
      created_at: {header: 'Created'},
    })
  }
}
