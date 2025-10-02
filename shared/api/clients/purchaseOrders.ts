import { initClient, type FetchApiOptions, type InitClientArgs, type InitClientReturn } from '@ts-rest/core';
import { purchaseOrdersContract } from '../contracts';

export type HeaderShape = Record<string, string | ((options: FetchApiOptions) => string)>;

export interface PurchaseOrdersClientOptions {
  baseUrl?: string;
  baseHeaders?: HeaderShape;
  throwOnUnknownStatus?: boolean;
}

const defaultHeaders: HeaderShape = {
  'Content-Type': 'application/json',
};

export type PurchaseOrdersContractClient = InitClientReturn<typeof purchaseOrdersContract, InitClientArgs>;

export const createPurchaseOrdersContractClient = (options: PurchaseOrdersClientOptions = {}): PurchaseOrdersContractClient => {
  const { baseUrl = '/api', baseHeaders, throwOnUnknownStatus = true } = options;

  const mergedHeaders: HeaderShape = {
    ...defaultHeaders,
    ...(baseHeaders ?? {}),
  };

  const clientArgs: InitClientArgs = {
    baseUrl,
    baseHeaders: mergedHeaders,
    throwOnUnknownStatus,
  };

  return initClient(purchaseOrdersContract, clientArgs);
};
