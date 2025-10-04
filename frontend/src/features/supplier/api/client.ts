import type { FetchApiOptions } from '@ts-rest/core';
import {
  createSuppliersContractClient,
  type SuppliersContractClient,
  type SuppliersClientOptions,
  type SuppliersClientHeaderShape,
} from '@pharmacy-pos/shared';

const resolveHeaderValue = (
  value: string | ((options: FetchApiOptions) => string) | undefined,
  options: FetchApiOptions,
): string | undefined => {
  if (typeof value === 'function') {
    return value(options);
  }
  return value;
};

const withAuthHeader = (
  baseHeaders: SuppliersClientHeaderShape = {},
): SuppliersClientHeaderShape => {
  const headers: SuppliersClientHeaderShape = {
    ...baseHeaders,
  };

  const baseAuthorization = baseHeaders?.Authorization;

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

  return headers;
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
    baseHeaders: withAuthHeader(baseHeaders),
  });
};

export const supplierContractClient = createSupplierContractClient();

export default supplierContractClient;
