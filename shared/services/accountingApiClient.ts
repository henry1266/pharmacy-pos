/**
 * 統一的會計 API 客戶端
 * 提供標準化的 API 調用方法，減少重複代碼
 */

import { format } from 'date-fns';
import type { 
  AccountingFilters, 
  ExtendedAccountingRecord, 
  UnaccountedSale,
  AccountingCategory 
} from '../types/accounting';
import type { AccountingRecord } from '../types/entities';
import type { ApiResponse } from '../types/api';

/**
 * API 客戶端介面 - 允許注入不同的 HTTP 客戶端
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
 * 日期格式化工具
 */
export const formatDateForApi = (date: Date | string | null | undefined): string | undefined => {
  if (!date) return undefined;
  return format(new Date(date), 'yyyy-MM-dd');
};

/**
 * 構建查詢參數
 */
export const buildQueryParams = (filters: AccountingFilters): URLSearchParams => {
  const params = new URLSearchParams();
  
  if (filters.startDate) {
    const formattedDate = formatDateForApi(filters.startDate);
    if (formattedDate) params.append('startDate', formattedDate);
  }
  
  if (filters.endDate) {
    const formattedDate = formatDateForApi(filters.endDate);
    if (formattedDate) params.append('endDate', formattedDate);
  }
  
  if (filters.shift) {
    params.append('shift', filters.shift);
  }
  
  return params;
};

/**
 * 會計 API 客戶端類
 */
export class AccountingApiClient {
  private httpClient: HttpClient;
  private readonly baseUrl: string;

  constructor(httpClient: HttpClient, baseUrl: string = '/api') {
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
  }

  /**
   * 獲取記帳記錄
   */
  async getAccountingRecords(filters: AccountingFilters = {}): Promise<ExtendedAccountingRecord[]> {
    try {
      const params = buildQueryParams(filters);
      const response = await this.httpClient.get<ApiResponse<ExtendedAccountingRecord[]>>(
        `${this.baseUrl}/accounting`,
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error, '獲取記帳記錄');
    }
  }

  /**
   * 創建記帳記錄
   */
  async createAccountingRecord(recordData: Partial<AccountingRecord>): Promise<AccountingRecord> {
    try {
      const dataToSend = {
        ...recordData,
        date: formatDateForApi(recordData.date)
      };
      const response = await this.httpClient.post<ApiResponse<AccountingRecord>>(
        `${this.baseUrl}/accounting`,
        dataToSend
      );
      return response.data.data!;
    } catch (error) {
      return handleApiError(error, '創建記帳記錄');
    }
  }

  /**
   * 更新記帳記錄
   */
  async updateAccountingRecord(id: string, recordData: Partial<AccountingRecord>): Promise<AccountingRecord> {
    try {
      const dataToSend = {
        ...recordData,
        date: formatDateForApi(recordData.date)
      };
      const response = await this.httpClient.put<ApiResponse<AccountingRecord>>(
        `${this.baseUrl}/accounting/${id}`,
        dataToSend
      );
      return response.data.data!;
    } catch (error) {
      return handleApiError(error, `更新記帳記錄 ${id}`);
    }
  }

  /**
   * 刪除記帳記錄
   */
  async deleteAccountingRecord(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.httpClient.delete<ApiResponse<any>>(
        `${this.baseUrl}/accounting/${id}`
      );
      const result: { success: boolean; message?: string } = {
        success: response.data.success
      };
      if (response.data.message) {
        result.message = response.data.message;
      }
      return result;
    } catch (error) {
      return handleApiError(error, `刪除記帳記錄 ${id}`);
    }
  }

  /**
   * 獲取未結算銷售記錄
   */
  async getUnaccountedSales(date: string): Promise<UnaccountedSale[]> {
    try {
      const response = await this.httpClient.get<ApiResponse<UnaccountedSale[]>>(
        `${this.baseUrl}/accounting/unaccounted-sales`,
        { params: { date } }
      );
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error, '獲取未結算銷售記錄');
    }
  }

  /**
   * 獲取記帳分類
   */
  async getAccountingCategories(): Promise<AccountingCategory[]> {
    try {
      const response = await this.httpClient.get<ApiResponse<AccountingCategory[]>>(
        `${this.baseUrl}/accounting-categories`
      );
      return response.data.data || [];
    } catch (error) {
      return handleApiError(error, '獲取記帳名目類別');
    }
  }

  /**
   * 新增記帳分類
   */
  async addAccountingCategory(categoryData: Partial<AccountingCategory>): Promise<AccountingCategory> {
    try {
      const response = await this.httpClient.post<ApiResponse<AccountingCategory>>(
        `${this.baseUrl}/accounting-categories`,
        categoryData
      );
      return response.data.data!;
    } catch (error) {
      return handleApiError(error, '新增記帳名目類別');
    }
  }

  /**
   * 更新記帳分類
   */
  async updateAccountingCategory(id: string, categoryData: Partial<AccountingCategory>): Promise<AccountingCategory> {
    try {
      const response = await this.httpClient.put<ApiResponse<AccountingCategory>>(
        `${this.baseUrl}/accounting-categories/${id}`,
        categoryData
      );
      return response.data.data!;
    } catch (error) {
      return handleApiError(error, '更新記帳名目類別');
    }
  }

  /**
   * 刪除記帳分類
   */
  async deleteAccountingCategory(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.httpClient.delete<ApiResponse<null>>(
        `${this.baseUrl}/accounting-categories/${id}`
      );
      const result: { success: boolean; message?: string } = {
        success: response.data.success
      };
      if (response.data.message) {
        result.message = response.data.message;
      }
      return result;
    } catch (error) {
      return handleApiError(error, '刪除記帳名目類別');
    }
  }
}

/**
 * 創建會計 API 客戶端實例的工廠函數
 */
export const createAccountingApiClient = (httpClient: HttpClient, baseUrl?: string): AccountingApiClient => {
  return new AccountingApiClient(httpClient, baseUrl);
};