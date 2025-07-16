import HTTP from '@heroku/http-call'
import {APIClient} from '@heroku-cli/command'

import {AddonType, SearchConnectionsResponse} from './types'

const baseURL = process.env.CONNECT_DISCOVERY_SERVER || (process.env.CONNECT_ADDON === 'connectqa'
  ? 'https://hc-central-qa.herokai.com'
  : 'https://hc-central.heroku.com')

export async function searchConnections(
  heroku: APIClient,
  appName: string,
  resourceName?: string,
  addonType?: AddonType
): Promise<HTTP<SearchConnectionsResponse>> {
  const resourceNameQueryParam = resourceName ? `&resource_name=${resourceName}` : ''
  const addonTypeQueryParam = addonType ? `&addon_type=${addonType}` : ''
  const url = `/connections?app=${appName}${resourceNameQueryParam}${addonTypeQueryParam}`
  return heroku.get<SearchConnectionsResponse>(url, {
    hostname: new URL(baseURL).hostname,
    headers: {
      Accept: 'application/json',
      'Heroku-Client': 'cli',
    },
  })
}

export async function requestAppAccess(heroku: APIClient, appName: string, addonType?: AddonType): Promise<HTTP<any>> {
  const addonTypeQueryParam = addonType ? `?addon_type=${addonType}` : ''
  const url = `/auth/${appName}${addonTypeQueryParam}`
  return heroku.post<any>(url, {
    hostname: new URL(baseURL).hostname,
    headers: {
      Accept: 'application/json',
      'Heroku-Client': 'cli',
    },
  })
}
