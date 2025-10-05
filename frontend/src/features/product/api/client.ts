import type { FetchApiOptions } from '@ts-rest/core';
import {
  createProductsContractClient,
  type ProductsContractClient,
  type ProductsClientOptions,
  type ProductsClientHeaderShape,
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
  baseHeaders: ProductsClientHeaderShape = {},
): ProductsClientHeaderShape => {
  const headers: ProductsClientHeaderShape = {
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

export const createProductContractClient = (
  options: ProductsClientOptions = {},
): ProductsContractClient => {
  const {
    baseHeaders,
    baseUrl = '/api',
    throwOnUnknownStatus = true,
  } = options;

  return createProductsContractClient({
    baseUrl,
    throwOnUnknownStatus,
    baseHeaders: withAuthHeader(baseHeaders),
  });
};

export const productContractClient = createProductContractClient();

export default productContractClient;
