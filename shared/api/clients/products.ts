import { initClient, type FetchApiOptions, type InitClientArgs, type InitClientReturn } from '@ts-rest/core'
import { productsContract } from '../contracts/products'

export type ProductsClientHeaderShape = Record<string, string | ((options: FetchApiOptions) => string)>

export interface ProductsClientOptions {
  baseUrl?: string
  baseHeaders?: ProductsClientHeaderShape
  throwOnUnknownStatus?: boolean
}

const defaultHeaders: ProductsClientHeaderShape = {
  'Content-Type': 'application/json',
}

export type ProductsContractClient = InitClientReturn<typeof productsContract, InitClientArgs>

export const createProductsContractClient = (options: ProductsClientOptions = {}): ProductsContractClient => {
  const { baseUrl = '/api', baseHeaders, throwOnUnknownStatus = true } = options

  const mergedHeaders: ProductsClientHeaderShape = {
    ...defaultHeaders,
    ...(baseHeaders ?? {}),
  }

  const clientArgs: InitClientArgs = {
    baseUrl,
    baseHeaders: mergedHeaders,
    throwOnUnknownStatus,
  }

  return initClient(productsContract, clientArgs)
}
