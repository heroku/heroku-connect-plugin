import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'

import type {Connection} from '../connect/api.js'

export type ConnectContext = {
  app?: string
  args: Record<string, unknown>
  auth: {password: string}
  flags: Record<string, unknown>
  region?: string
}

type RequestOptions = {
  baseURL: string
  data?: unknown
  method: AxiosRequestConfig['method']
  params?: null | Record<string, unknown>
  url: string
}

export class ConnectClient {
  private readonly client: AxiosInstance

  constructor(context: ConnectContext) {
    this.client = axios.create({
      headers: {
        Authorization: `Bearer ${context.auth.password}`,
        'Content-Type': 'application/json',
        'Heroku-Client': 'cli',
      },
    })
  }

  getDetails(connection: Connection): Promise<AxiosResponse> {
    const detailUrl = connection.detail_url
    return this.client.get(`${detailUrl}?deep=true`)
  }

  request({baseURL, data, method, params, url}: RequestOptions): Promise<AxiosResponse> {
    return this.client({
      baseURL, data, method, params, url,
    })
  }
}
