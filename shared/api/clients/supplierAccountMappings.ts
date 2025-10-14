import { initClient, type FetchApiOptions, type InitClientArgs, type InitClientReturn } from '@ts-rest/core';
import { supplierAccountMappingsContract } from '../contracts';

export type SupplierAccountMappingsHeaderShape = Record<
  string,
  string | ((options: FetchApiOptions) => string)
>;

export interface SupplierAccountMappingsClientOptions {
  baseUrl?: string;
  baseHeaders?: SupplierAccountMappingsHeaderShape;
  throwOnUnknownStatus?: boolean;
}

const defaultHeaders: SupplierAccountMappingsHeaderShape = {
  'Content-Type': 'application/json',
};

export type SupplierAccountMappingsContractClient = InitClientReturn<
  typeof supplierAccountMappingsContract,
  InitClientArgs
>;

export const createSupplierAccountMappingsContractClient = (
  options: SupplierAccountMappingsClientOptions = {},
): SupplierAccountMappingsContractClient => {
  const { baseUrl = '/api', baseHeaders, throwOnUnknownStatus = true } = options;

  const mergedHeaders: SupplierAccountMappingsHeaderShape = {
    ...defaultHeaders,
    ...(baseHeaders ?? {}),
  };

  const clientArgs: InitClientArgs = {
    baseUrl,
    baseHeaders: mergedHeaders,
    throwOnUnknownStatus,
  };

  return initClient(supplierAccountMappingsContract, clientArgs);
};
