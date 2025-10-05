import { initClient, type FetchApiOptions, type InitClientArgs, type InitClientReturn } from '@ts-rest/core'
import { accountingContract } from '../contracts/accounting'

export type HeaderShape = Record<string, string | ((options: FetchApiOptions) => string)>

export interface AccountingClientOptions {
  baseUrl?: string
  baseHeaders?: HeaderShape
  throwOnUnknownStatus?: boolean
}

const defaultHeaders: HeaderShape = {
  'Content-Type': 'application/json',
}

export type AccountingContractClient = InitClientReturn<typeof accountingContract, InitClientArgs>

export const createAccountingContractClient = (options: AccountingClientOptions = {}): AccountingContractClient => {
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

  return initClient(accountingContract, clientArgs)
}
