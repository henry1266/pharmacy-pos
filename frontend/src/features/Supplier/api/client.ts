/**
 * Supplier API 客戶端
 * 參考 sale 模組的 Axios 設計，提供統一的攔截與錯誤映射
 */
import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// API 錯誤類型
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

// API 錯誤介面
export interface ApiError {
  type: ApiErrorType;
  status?: number | undefined;
  message: string;
  originalError?: any | undefined;
}

const createApiError = (type: ApiErrorType, message: string, status?: number, originalError?: any): ApiError => ({
  type,
  status,
  message,
  originalError
});

const mapAxiosError = (error: AxiosError): ApiError => {
  if (error.code === 'ECONNABORTED') {
    return createApiError(ApiErrorType.TIMEOUT_ERROR, '請求逾時，請稍後重試', undefined, error);
  }
  if (error.code === 'ERR_NETWORK') {
    return createApiError(ApiErrorType.NETWORK_ERROR, '網路連線失敗，請檢查網路狀態', undefined, error);
  }
  if (error.response) {
    const { status } = error.response;
    const data = error.response.data as Record<string, any>;
    const message = data?.msg || data?.message || error.message;
    switch (status) {
      case 400: return createApiError(ApiErrorType.VALIDATION_ERROR, message || '請求參數錯誤', status, error);
      case 401: return createApiError(ApiErrorType.UNAUTHORIZED, message || '未授權，請重新登入', status, error);
      case 403: return createApiError(ApiErrorType.FORBIDDEN, message || '無權訪問此資源', status, error);
      case 404: return createApiError(ApiErrorType.NOT_FOUND, message || '找不到資源', status, error);
      case 500:
      case 502:
      case 503:
      case 504:
        return createApiError(ApiErrorType.SERVER_ERROR, message || '伺服器錯誤，請稍後再試', status, error);
      default:
        return createApiError(ApiErrorType.UNKNOWN_ERROR, message || '未知錯誤', status, error);
    }
  }
  return createApiError(ApiErrorType.UNKNOWN_ERROR, error.message || '未知錯誤', undefined, error);
};

export const createSupplierApiClient = (baseURL = '/api'): AxiosInstance => {
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

export const supplierApiClient = createSupplierApiClient();
export default supplierApiClient;
