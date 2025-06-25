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
  const message = error.response?.data?.message ?? `${operation} 失敗`;
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
      return response.data.data!;
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
      return response.data.data!;
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
      return response.data.data!;
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
  baseUrl: string = '/api'
): T => {
  return new ClientClass(httpClient, baseUrl);
};