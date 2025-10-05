import type { FetchApiOptions } from '@ts-rest/core'
import {
  createEmployeesContractClient,
  type EmployeesContractClient,
  type EmployeesClientOptions,
  type HeaderShape as EmployeesClientHeaderShape,
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
  baseHeaders: EmployeesClientHeaderShape = {},
): EmployeesClientHeaderShape => {
  const headers: EmployeesClientHeaderShape = {
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

export const createEmployeeContractClient = (
  options: EmployeesClientOptions = {},
): EmployeesContractClient => {
  const {
    baseHeaders,
    baseUrl = '/api',
    throwOnUnknownStatus = true,
  } = options

  return createEmployeesContractClient({
    baseUrl,
    throwOnUnknownStatus,
    baseHeaders: withAuthHeader(baseHeaders),
  })
}

export const employeeContractClient = createEmployeeContractClient()

export default employeeContractClient
