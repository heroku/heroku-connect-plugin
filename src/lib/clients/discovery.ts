import axios, {AxiosInstance, AxiosResponse} from 'axios'

import {ConnectContext} from './connect.js'

const baseURL = process.env.CONNECT_DISCOVERY_SERVER || (process.env.CONNECT_ADDON === 'connectqa'
  ? 'https://hc-central-qa.herokai.com'
  : 'https://hc-central.heroku.com')

export class DiscoveryClient {
  private readonly client: AxiosInstance

  constructor(context: ConnectContext) {
    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${context.auth.password}`,
        'Content-Type': 'application/json',
        'Heroku-Client': 'cli',
      },
    })
  }

  requestAppAccess(appName: string, addonType?: number): Promise<AxiosResponse> {
    const addonTypeQueryParam = addonType ? `?addon_type=${addonType}` : ''
    const url = `/auth/${appName}${addonTypeQueryParam}`
    return this.client({method: 'POST', url})
  }

  searchConnections(appName: string, resourceName?: string, addonType?: number): Promise<AxiosResponse> {
    const resourceNameQueryParam = resourceName ? `&resource_name=${resourceName}` : ''
    const addonTypeQueryParam = addonType ? `&addon_type=${addonType}` : ''
    const url = `/connections?app=${appName}${resourceNameQueryParam}${addonTypeQueryParam}`
    return this.client(url)
  }
}
