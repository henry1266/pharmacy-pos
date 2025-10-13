import {
  initClient,
  type FetchApiOptions,
  type InitClientArgs,
  type InitClientReturn,
} from '@ts-rest/core';
import { fifoContract } from '../contracts';

export type HeaderShape = Record<string, string | ((options: FetchApiOptions) => string)>;

export interface FifoClientOptions {
  baseUrl?: string;
  baseHeaders?: HeaderShape;
  throwOnUnknownStatus?: boolean;
}

const defaultHeaders: HeaderShape = {
  'Content-Type': 'application/json',
};

export type FifoContractClient = InitClientReturn<typeof fifoContract, InitClientArgs>;

export const createFifoContractClient = (options: FifoClientOptions = {}): FifoContractClient => {
  const {
    baseUrl = '/api',
    baseHeaders,
    throwOnUnknownStatus = true,
  } = options;

  const mergedHeaders: HeaderShape = {
    ...defaultHeaders,
    ...(baseHeaders ?? {}),
  };

  const clientArgs: InitClientArgs = {
    baseUrl,
    baseHeaders: mergedHeaders,
    throwOnUnknownStatus,
  };

  return initClient(fifoContract, clientArgs);
};
