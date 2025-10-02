import { initClient, type FetchApiOptions, type InitClientArgs, type InitClientReturn } from '@ts-rest/core';
import { salesContract } from '../contracts';

export type HeaderShape = Record<string, string | ((options: FetchApiOptions) => string)>;

export interface SalesClientOptions {
  baseUrl?: string;
  baseHeaders?: HeaderShape;
  throwOnUnknownStatus?: boolean;
}

const defaultHeaders: HeaderShape = {
  'Content-Type': 'application/json',
};

export type SalesContractClient = InitClientReturn<typeof salesContract, InitClientArgs>;

export const createSalesContractClient = (options: SalesClientOptions = {}): SalesContractClient => {
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

  return initClient(salesContract, clientArgs);
};
