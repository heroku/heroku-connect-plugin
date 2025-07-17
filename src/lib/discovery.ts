import {APIClient} from '@heroku-cli/command'

import {AddonType, RequestAppAccessResponse, SearchConnectionsResponse} from './types'

export async function searchConnections(
  heroku: APIClient,
  appName: string,
  resourceName?: string,
  addonType?: AddonType
): Promise<SearchConnectionsResponse> {
  const baseURL = process.env.CONNECT_DISCOVERY_SERVER || (process.env.CONNECT_ADDON === 'connectqa'
    ? 'https://hc-central-qa.herokai.com'
    : 'https://hc-central.heroku.com')
  const resourceNameQueryParam = resourceName ? `&resource_name=${resourceName}` : ''
  const addonTypeQueryParam = addonType ? `&addon_type=${addonType}` : ''
  const url = `/connections?app=${appName}${resourceNameQueryParam}${addonTypeQueryParam}`
  const {body: searchConnectionsResponse} = await heroku.get<SearchConnectionsResponse>(url, {
    hostname: new URL(baseURL).hostname,
    headers: {
      Accept: 'application/json',
      'Heroku-Client': 'cli',
    },
  })
  return searchConnectionsResponse
}

export async function requestAppAccess(heroku: APIClient, appName: string, addonType?: AddonType): Promise<RequestAppAccessResponse> {
  const baseURL = process.env.CONNECT_DISCOVERY_SERVER || (process.env.CONNECT_ADDON === 'connectqa'
    ? 'https://hc-central-qa.herokai.com'
    : 'https://hc-central.heroku.com')
  const addonTypeQueryParam = addonType ? `?addon_type=${addonType}` : ''
  const url = `/auth/${appName}${addonTypeQueryParam}`
  const {body: requestAppAccessResponse} = await heroku.post<RequestAppAccessResponse>(url, {
    hostname: new URL(baseURL).hostname,
    headers: {
      Accept: 'application/json',
      'Heroku-Client': 'cli',
    },
  })
  return requestAppAccessResponse
}
