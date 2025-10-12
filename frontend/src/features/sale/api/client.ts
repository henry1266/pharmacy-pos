import type { FetchApiOptions } from '@ts-rest/core';
import {
  createSalesContractClient,
  type SalesContractClient,
  type SalesClientOptions,
  type SalesClientHeaderShape,
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
  baseHeaders: SalesClientHeaderShape = {},
): SalesClientHeaderShape => {
  const headers: SalesClientHeaderShape = {
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

export const createSalesContractClientWithAuth = (
  options: SalesClientOptions = {},
): SalesContractClient => {
  const {
    baseHeaders,
    baseUrl = '/api',
    throwOnUnknownStatus = true,
  } = options;

  return createSalesContractClient({
    baseUrl,
    throwOnUnknownStatus,
    baseHeaders: withAuthHeader(baseHeaders),
  });
};

export const salesContractClient = createSalesContractClientWithAuth();

export default salesContractClient;
