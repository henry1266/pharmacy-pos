import type { FetchApiOptions } from '@ts-rest/core'
import {
  createDashboardContractClient,
  type DashboardContractClient,
  type DashboardClientOptions,
  type DashboardClientHeaderShape,
} from '@pharmacy-pos/shared'

const resolveHeaderValue = (
  value: string | ((options: FetchApiOptions) => string) | undefined,
  options: FetchApiOptions,
): string | undefined => {
  if (typeof value === 'function') {
    return value(options)
  }
  return value
}

const withAuthHeader = (
  baseHeaders: DashboardClientHeaderShape = {},
): DashboardClientHeaderShape => {
  const headers: DashboardClientHeaderShape = {
    ...baseHeaders,
  }

  const baseAuthorization = baseHeaders?.Authorization

  headers.Authorization = (options: FetchApiOptions) => {
    const token = typeof window !== 'undefined'
      ? window.localStorage?.getItem('token')
      : undefined

    if (token && token.trim().length > 0) {
      return `Bearer ${token}`
    }

    const fallback = resolveHeaderValue(baseAuthorization, options)
    return fallback ?? ''
  }

  return headers
}

export const createDashboardContractClientWithAuth = (
  options: DashboardClientOptions = {},
): DashboardContractClient => {
  const {
    baseHeaders,
    baseUrl = '/api',
    throwOnUnknownStatus = true,
  } = options

  return createDashboardContractClient({
    baseUrl,
    throwOnUnknownStatus,
    baseHeaders: withAuthHeader(baseHeaders),
  })
}

export const dashboardContractClient = createDashboardContractClientWithAuth()

export default dashboardContractClient
