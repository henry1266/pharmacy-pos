import type { FetchApiOptions } from '@ts-rest/core'
import {
  createAccountingContractClient,
  type AccountingContractClient,
  type AccountingClientOptions,
  type AccountingClientHeaderShape,
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
  baseHeaders: AccountingClientHeaderShape = {},
): AccountingClientHeaderShape => {
  const headers: AccountingClientHeaderShape = {
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

export const createAccountingContractClientWithAuth = (
  options: AccountingClientOptions = {},
): AccountingContractClient => {
  const {
    baseHeaders,
    baseUrl = '/api',
    throwOnUnknownStatus = true,
  } = options

  return createAccountingContractClient({
    baseUrl,
    throwOnUnknownStatus,
    baseHeaders: withAuthHeader(baseHeaders),
  })
}

export const accountingContractClient = createAccountingContractClientWithAuth()

export default accountingContractClient
