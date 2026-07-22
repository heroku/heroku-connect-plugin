import * as color from '@heroku/heroku-cli-util/color'
import {styledJSON, table} from '@heroku/heroku-cli-util/hux'
import {ux} from '@oclif/core'
import {AxiosRequestConfig, AxiosResponse} from 'axios'

import {ConnectClient, ConnectContext} from '../clients/connect.js'
import {DiscoveryClient} from '../clients/discovery.js'

export const ADDON_TYPE_SYNC = 1

export type ConnectionMapping = {
  [key: string]: unknown
  id: string
  object_name: string
  state: string
}

export type Connection = {
  [key: string]: unknown
  app_name?: string
  db_key?: string
  detail_url: string
  id: number
  internal_name?: string
  mappings: ConnectionMapping[]
  name?: string
  region_url?: string
  resource_name?: string
  schema_name?: string
  state?: string
}

export function request(
  context: ConnectContext,
  method: AxiosRequestConfig['method'],
  url: string,
  data?: unknown,
  params?: null | Record<string, unknown>,
): Promise<AxiosResponse> {
  if (!context.region) {
    throw new Error('Must provide region URL')
  }

  const connectClient = new ConnectClient(context)
  return connectClient.request({
    baseURL: context.region, data, method, params, url,
  })
}

export async function withUserConnections(
  context: ConnectContext,
  appName: string,
  addonType?: number,
): Promise<Connection[]> {
  const connectClient = new ConnectClient(context)
  const discoveryClient = new DiscoveryClient(context)

  const searchResponse = await discoveryClient.searchConnections(appName, context.flags.resource as string | undefined, addonType)
  const connections = searchResponse.data.results as Connection[]

  if (connections.length === 0) {
    return []
  }

  const fetchConnectionDetailFuncs = connections.map(async c => {
    const response = await connectClient.getDetails(c)
    return {...c, ...response.data} as Connection
  })

  return Promise.all(fetchConnectionDetailFuncs)
}

export async function withConnection(
  context: ConnectContext,
  addonType?: number,
): Promise<Connection> {
  const connectClient = new ConnectClient(context)
  const discoveryClient = new DiscoveryClient(context)

  const searchResponse = await discoveryClient.searchConnections(context.app as string, context.flags.resource as string | undefined, addonType)
  const connections = searchResponse.data.results as Connection[]

  if (connections.length === 0) {
    throw new Error('No connection(s) found')
  }

  if (connections.length > 1) {
    throw new Error("Multiple connections found. Please use '--resource' to specify a single connection by resource name. Use 'connect:info' to list the resource names.")
  }

  const match = connections[0]
  const matchDetailResponse = await connectClient.getDetails(match)
  return {...match, ...matchDetailResponse.data} as Connection
}

export async function withMapping(connection: Pick<Connection, 'mappings'>, objectName?: string): Promise<ConnectionMapping> {
  const objectNameLower = objectName?.toLowerCase()
  const mapping = connection.mappings.find(m => m.object_name.toLowerCase() === objectNameLower)
  if (mapping) {
    return mapping
  }

  throw new Error(`No mapping configured for ${objectName}`)
}

export async function requestAppAccess(
  context: ConnectContext,
  app: string,
  addonType?: number,
): Promise<Connection[]> {
  const discoveryClient = new DiscoveryClient(context)
  await discoveryClient.requestAppAccess(app, addonType)
  return withUserConnections(context, app, addonType)
}

export async function getWriteErrors(context: ConnectContext): Promise<void> {
  let url: string
  let action: string
  const mappingName = context.args.name as string | undefined
  const connection = await withConnection(context)
  context.region = connection.region_url
  if (mappingName) {
    const mapping = await withMapping(connection, mappingName)
    url = `/api/v3/mappings/${mapping.id}/errors`
    action = `Retrieving write errors for ${mappingName} on ${connection.name}`
  } else {
    url = `/api/v3/connections/${connection.id}/errors`
    action = `Retrieving write errors for ${connection.name}`
  }

  ux.action.start(action)
  const results = await request(context, 'GET', url)
  ux.action.stop()
  const errors = results.data

  if (errors.count === 0) {
    ux.stdout(color.green('No write errors in the last 24 hours'))
    return
  }

  if (context.flags.json) {
    styledJSON(errors.results)
    return
  }

  table(errors.results, {
    created_at: {header: 'Created'},
    id: {header: 'Trigger Log ID'},
    message: {header: 'Error Message'},
    record_id: {header: 'Table ID'},
    table_name: {header: 'Table Name'},
  })
}
