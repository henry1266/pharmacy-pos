import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  createPurchaseOrdersContractClient,
  type PurchaseOrdersContractClient,
  type PurchaseOrdersClientOptions,
  type PurchaseOrdersClientHeaderShape,
} from '@pharmacy-pos/shared';
import { withAuthHeader } from '@/features/supplier/api/client';

export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  type: ApiErrorType;
  status?: number;
  message: string;
  originalError?: unknown;
}

const createApiError = (type: ApiErrorType, message: string, status?: number, originalError?: unknown): ApiError => {
  const base: ApiError = {
    type,
    message
  };

  if (status !== undefined) base.status = status;
  if (originalError !== undefined) base.originalError = originalError;

  return base;
};

const mapAxiosError = (error: AxiosError): ApiError => {
  if (error.code === 'ECONNABORTED') return createApiError(ApiErrorType.TIMEOUT_ERROR, '請求逾時，請稍後再試', undefined, error);
  if (error.code === 'ERR_NETWORK') return createApiError(ApiErrorType.NETWORK_ERROR, '網路連線異常，請檢查設定', undefined, error);

  if (error.response) {
    const { status } = error.response;
    const data = error.response.data as Record<string, any> | undefined;
    const message = data?.msg ?? data?.message ?? error.message;

    switch (status) {
      case 400:
        return createApiError(ApiErrorType.VALIDATION_ERROR, message ?? '請求參數錯誤', status, error);
      case 401:
        return createApiError(ApiErrorType.UNAUTHORIZED, message ?? '未授權，請重新登入', status, error);
      case 403:
        return createApiError(ApiErrorType.FORBIDDEN, message ?? '沒有操作權限', status, error);
      case 404:
        return createApiError(ApiErrorType.NOT_FOUND, message ?? '找不到資源', status, error);
      case 500:
      case 502:
      case 503:
      case 504:
        return createApiError(ApiErrorType.SERVER_ERROR, message ?? '伺服器發生錯誤，請稍後再試', status, error);
      default:
        return createApiError(ApiErrorType.UNKNOWN_ERROR, message ?? '發生未知錯誤', status, error);
    }
  }

  return createApiError(ApiErrorType.UNKNOWN_ERROR, error.message ?? '發生未知錯誤', undefined, error);
};

export const createPurchaseOrderApiClient = (baseURL = '/api/purchase-orders'): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
  });

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['x-auth-token'] = token;
      }
      config.headers = config.headers ?? {};
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
      return config;
    },
    (error) => Promise.reject(mapAxiosError(error))
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => Promise.reject(mapAxiosError(error))
  );

  return client;
};

export const purchaseOrderApiClient = createPurchaseOrderApiClient();

export const createPurchaseOrdersContractClientWithAuth = (
  options: PurchaseOrdersClientOptions = {},
): PurchaseOrdersContractClient => {
  const {
    baseHeaders,
    baseUrl = '/api',
    throwOnUnknownStatus = true,
  } = options;

  return createPurchaseOrdersContractClient({
    baseUrl,
    throwOnUnknownStatus,
    baseHeaders: withAuthHeader<PurchaseOrdersClientHeaderShape>(baseHeaders),
  });
};

export const purchaseOrdersContractClient = createPurchaseOrdersContractClientWithAuth();

export default purchaseOrderApiClient;
