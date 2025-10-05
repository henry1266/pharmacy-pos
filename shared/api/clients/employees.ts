import { initClient, type FetchApiOptions, type InitClientArgs, type InitClientReturn } from '@ts-rest/core'
import { employeesContract } from '../contracts/employees'

export type HeaderShape = Record<string, string | ((options: FetchApiOptions) => string)>

export interface EmployeesClientOptions {
  baseUrl?: string
  baseHeaders?: HeaderShape
  throwOnUnknownStatus?: boolean
}

const defaultHeaders: HeaderShape = {
  'Content-Type': 'application/json',
}

export type EmployeesContractClient = InitClientReturn<typeof employeesContract, InitClientArgs>

export const createEmployeesContractClient = (options: EmployeesClientOptions = {}): EmployeesContractClient => {
  const { baseUrl = '/api', baseHeaders, throwOnUnknownStatus = true } = options

  const mergedHeaders: HeaderShape = {
    ...defaultHeaders,
    ...(baseHeaders ?? {}),
  }

  const clientArgs: InitClientArgs = {
    baseUrl,
    baseHeaders: mergedHeaders,
    throwOnUnknownStatus,
  }

  return initClient(employeesContract, clientArgs)
}
