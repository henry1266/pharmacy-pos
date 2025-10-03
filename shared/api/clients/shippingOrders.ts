import { initClient, type FetchApiOptions, type InitClientArgs, type InitClientReturn } from '@ts-rest/core';
import { shippingOrdersContract } from '../contracts';

export type HeaderShape = Record<string, string | ((options: FetchApiOptions) => string)>;

export interface ShippingOrdersClientOptions {
  baseUrl?: string;
  baseHeaders?: HeaderShape;
  throwOnUnknownStatus?: boolean;
}

const defaultHeaders: HeaderShape = {
  'Content-Type': 'application/json',
};

export type ShippingOrdersContractClient = InitClientReturn<typeof shippingOrdersContract, InitClientArgs>;

export const createShippingOrdersContractClient = (options: ShippingOrdersClientOptions = {}): ShippingOrdersContractClient => {
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

  return initClient(shippingOrdersContract, clientArgs);
};
