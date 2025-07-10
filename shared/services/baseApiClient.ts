/**
 * 通用 API 客戶端基礎類
 * 提供標準化的 CRUD 操作和錯誤處理
 */

import type { ApiResponse } from '../types/api';

/**
 * HTTP 客戶端介面
 */
export interface HttpClient {
  get<T>(url: string, config?: any): Promise<{ data: T }>;
  post<T>(url: string, data?: any, config?: any): Promise<{ data: T }>;
  put<T>(url: string, data?: any, config?: any): Promise<{ data: T }>;
  delete<T>(url: string, config?: any): Promise<{ data: T }>;
}

/**
 * 統一的錯誤處理函數
 */
export const handleApiError = (error: any, operation: string): never => {
  console.error(`${operation} 失敗:`, error);
  
  // 詳細的錯誤資訊提取
  let message = `${operation} 失敗`;
  
  if (error.response) {
    // HTTP 錯誤響應
    const { status, data } = error.response;
    
    if (data?.message) {
      message = data.message;
    } else if (data?.details && Array.isArray(data.details)) {
      // 驗證錯誤詳情
      const validationErrors = data.details.map((detail: any) => detail.msg || detail.message).join(', ');
      message = `資料驗證失敗: ${validationErrors}`;
    } else if (status === 400) {
      message = '資料驗證失敗';
    } else if (status === 401) {
      message = '未授權的存取';
    } else if (status === 403) {
      message = '禁止存取';
    } else if (status === 404) {
      message = '找不到資源';
    } else if (status === 409) {
      message = '資料衝突';
    } else if (status >= 500) {
      message = '伺服器內部錯誤';
    }
  } else if (error.request) {
    // 網路錯誤
    message = '網路連線錯誤';
  } else {
    // 其他錯誤
    message = error.message || `${operation} 失敗`;
  }
  
  throw new Error(message);
};

/**
 * 通用 API 客戶端基礎類
 */
export abstract class BaseApiClient {
  protected httpClient: HttpClient;
  protected baseUrl: string;

  constructor(httpClient: HttpClient, baseUrl: string) {
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
  }

  /**
   * 統一的 GET 請求處理
   */
  protected async get<T>(endpoint: string, params?: any): Promise<T> {
    try {
      const response = await this.httpClient.get<ApiResponse<T>>(
        `${this.baseUrl}${endpoint}`,
        { params }
      );
      // 檢查回應格式，支援直接回傳資料或包裝在 ApiResponse 中
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        return (response.data as ApiResponse<T>).data!;
      }
      return response.data as T;
    } catch (error) {
      return handleApiError(error, `GET ${endpoint}`);
    }
  }

  /**
   * 統一的 POST 請求處理
   */
  protected async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await this.httpClient.post<ApiResponse<T>>(
        `${this.baseUrl}${endpoint}`,
        data
      );
      // 檢查回應格式，支援直接回傳資料或包裝在 ApiResponse 中
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        return (response.data as ApiResponse<T>).data!;
      }
      return response.data as T;
    } catch (error) {
      return handleApiError(error, `POST ${endpoint}`);
    }
  }

  /**
   * 統一的 PUT 請求處理
   */
  protected async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await this.httpClient.put<ApiResponse<T>>(
        `${this.baseUrl}${endpoint}`,
        data
      );
      // 檢查回應格式，支援直接回傳資料或包裝在 ApiResponse 中
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        return (response.data as ApiResponse<T>).data!;
      }
      return response.data as T;
    } catch (error) {
      return handleApiError(error, `PUT ${endpoint}`);
    }
  }

  /**
   * 統一的 DELETE 請求處理
   */
  protected async delete<T>(endpoint: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.httpClient.delete<ApiResponse<T>>(
        `${this.baseUrl}${endpoint}`
      );
      const result: { success: boolean; message?: string } = { 
        success: response.data.success
      };
      if (response.data.message) {
        result.message = response.data.message;
      }
      return result;
    } catch (error) {
      return handleApiError(error, `DELETE ${endpoint}`);
    }
  }

  /**
   * 獲取列表數據的通用方法
   */
  protected async getList<T>(endpoint: string, params?: any): Promise<T[]> {
    const result = await this.get<T[]>(endpoint, params);
    return result || [];
  }

  /**
   * 獲取單個項目的通用方法
   */
  protected async getItem<T>(endpoint: string, id: string): Promise<T> {
    return this.get<T>(`${endpoint}/${id}`);
  }

  /**
   * 創建項目的通用方法
   */
  protected async createItem<T>(endpoint: string, data: Partial<T>): Promise<T> {
    return this.post<T>(endpoint, data);
  }

  /**
   * 更新項目的通用方法
   */
  protected async updateItem<T>(endpoint: string, id: string, data: Partial<T>): Promise<T> {
    return this.put<T>(`${endpoint}/${id}`, data);
  }

  /**
   * 刪除項目的通用方法
   */
  protected async deleteItem(endpoint: string, id: string): Promise<{ success: boolean; message?: string }> {
    return this.delete(`${endpoint}/${id}`);
  }
}

/**
 * 創建 API 客戶端的工廠函數
 */
export const createApiClient = <T extends BaseApiClient>(
  ClientClass: new (httpClient: HttpClient, baseUrl: string) => T,
  httpClient: HttpClient,
  baseUrl: string
): T => {
  if (!baseUrl) {
    throw new Error('baseUrl 參數為必填項，請提供有效的 API 基礎 URL');
  }
  return new ClientClass(httpClient, baseUrl);
};