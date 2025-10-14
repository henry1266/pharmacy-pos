import type { FetchApiOptions } from '@ts-rest/core';
import {
  createSuppliersContractClient,
  type SuppliersContractClient,
  type SuppliersClientOptions,
  type SuppliersClientHeaderShape,
} from '@pharmacy-pos/shared';

export const resolveHeaderValue = (
  value: string | ((options: FetchApiOptions) => string) | undefined,
  options: FetchApiOptions,
): string | undefined => {
  if (typeof value === 'function') {
    return value(options);
  }
  return value;
};

export const withAuthHeader = <THeaders extends Record<string, string | ((options: FetchApiOptions) => string)>>(
  baseHeaders: THeaders | undefined = {} as THeaders,
): THeaders => {
  const headers: Record<string, string | ((options: FetchApiOptions) => string)> = {
    ...(baseHeaders ?? {}),
  };

  const baseAuthorization = headers.Authorization;

  headers.Authorization = (options: FetchApiOptions) => {
    const token = typeof window !== 'undefined'
      ? window.localStorage?.getItem('token')
      : undefined;

    if (token && token.trim().length > 0) {
      return `Bearer ${token}`;
    }

    const fallback = resolveHeaderValue(baseAuthorization, options);
    return fallback ?? '';
  };

  return headers as THeaders;
};

export const createSupplierContractClient = (
  options: SuppliersClientOptions = {},
): SuppliersContractClient => {
  const {
    baseHeaders,
    baseUrl = '/api',
    throwOnUnknownStatus = true,
  } = options;

  return createSuppliersContractClient({
    baseUrl,
    throwOnUnknownStatus,
    baseHeaders: withAuthHeader<SuppliersClientHeaderShape>(baseHeaders),
  });
};

export const supplierContractClient = createSupplierContractClient();

export default supplierContractClient;
