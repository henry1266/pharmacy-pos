import { initClient, type FetchApiOptions, type InitClientArgs, type InitClientReturn } from '@ts-rest/core';
import { customersContract } from '../contracts';

export type HeaderShape = Record<string, string | ((options: FetchApiOptions) => string)>;

export interface CustomersClientOptions {
  baseUrl?: string;
  baseHeaders?: HeaderShape;
  throwOnUnknownStatus?: boolean;
}

const defaultHeaders: HeaderShape = {
  'Content-Type': 'application/json',
};

export type CustomersContractClient = InitClientReturn<typeof customersContract, InitClientArgs>;

export const createCustomersContractClient = (options: CustomersClientOptions = {}): CustomersContractClient => {
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

  return initClient(customersContract, clientArgs);
};
