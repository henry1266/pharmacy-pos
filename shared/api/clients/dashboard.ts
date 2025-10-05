import { initClient, type FetchApiOptions, type InitClientArgs, type InitClientReturn } from '@ts-rest/core'
import { dashboardContract } from '../contracts/dashboard'

export type HeaderShape = Record<string, string | ((options: FetchApiOptions) => string)>

export interface DashboardClientOptions {
  baseUrl?: string
  baseHeaders?: HeaderShape
  throwOnUnknownStatus?: boolean
}

const defaultHeaders: HeaderShape = {
  'Content-Type': 'application/json',
}

export type DashboardContractClient = InitClientReturn<typeof dashboardContract, InitClientArgs>

export const createDashboardContractClient = (options: DashboardClientOptions = {}): DashboardContractClient => {
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

  return initClient(dashboardContract, clientArgs)
}
