/**
 * Sale API 客戶端
 * 實作 Axios 客戶端 + 攔截器 + 錯誤映射
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

// 創建 API 錯誤
const createApiError = (type: ApiErrorType, message: string, status?: number | undefined, originalError?: any | undefined): ApiError => ({
  type,
  status,
  message,
  originalError
});

// 映射 Axios 錯誤到 API 錯誤
const mapAxiosError = (error: AxiosError): ApiError => {
  // 網絡錯誤
  if (error.code === 'ECONNABORTED') {
    return createApiError(ApiErrorType.TIMEOUT_ERROR, '請求超時，請稍後再試', undefined, error);
  }

  if (error.code === 'ERR_NETWORK') {
    return createApiError(ApiErrorType.NETWORK_ERROR, '網絡連接失敗，請檢查您的網絡連接', undefined, error);
  }

  // 服務器響應錯誤
  if (error.response) {
    const { status } = error.response;
    // 使用類型斷言來處理 data 可能是任何類型的情況
    const data = error.response.data as Record<string, any>;
    const message = data?.msg || data?.message || error.message;

    switch (status) {
      case 400:
        return createApiError(ApiErrorType.VALIDATION_ERROR, message || '請求參數無效', status, error);
      case 401:
        return createApiError(ApiErrorType.UNAUTHORIZED, message || '未授權，請重新登入', status, error);
      case 403:
        return createApiError(ApiErrorType.FORBIDDEN, message || '無權訪問此資源', status, error);
      case 404:
        return createApiError(ApiErrorType.NOT_FOUND, message || '找不到請求的資源', status, error);
      case 500:
      case 502:
      case 503:
      case 504:
        return createApiError(ApiErrorType.SERVER_ERROR, message || '伺服器錯誤，請稍後再試', status, error);
      default:
        return createApiError(ApiErrorType.UNKNOWN_ERROR, message || '發生未知錯誤', status, error);
    }
  }

  // 其他錯誤
  return createApiError(ApiErrorType.UNKNOWN_ERROR, error.message || '發生未知錯誤', undefined, error);
};

/**
 * 創建 Sale API 客戶端
 */
export const createSaleApiClient = (baseURL = '/api'): AxiosInstance => {
  // 創建 Axios 實例
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 請求攔截器
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 從 localStorage 獲取 token
      const token = localStorage.getItem('token');
      
      // 如果有 token，添加到請求頭
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      console.error('請求攔截器錯誤:', error);
      return Promise.reject(mapAxiosError(error));
    }
  );

  // 響應攔截器
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // 直接返回響應數據
      return response;
    },
    (error) => {
      console.error('響應攔截器錯誤:', error);
      
      // 映射錯誤
      const apiError = mapAxiosError(error);
      
      // 如果是未授權錯誤，可以在這裡處理登出邏輯
      if (apiError.type === ApiErrorType.UNAUTHORIZED) {
        // 清除 token
        localStorage.removeItem('token');
        
        // 可以在這裡添加重定向到登入頁面的邏輯
        // window.location.href = '/login';
      }
      
      return Promise.reject(apiError);
    }
  );

  return client;
};

// 導出默認客戶端實例
export const saleApiClient = createSaleApiClient();

// 導出常用方法
export default saleApiClient;