/**
 * Accounting2 交易管理 API 客戶端
 * 提供交易相關的 API 調用方法，包含批次操作支援和進度追蹤
 */

import apiService from '../../../../utils/apiService';
import type {
  TransactionGroupWithEntries,
  EmbeddedAccountingEntry,
  TransactionGroupFilter,
  TransactionGroupListResponse,
  TransactionGroupDetailResponse
} from '@pharmacy-pos/shared';

// 本地介面定義（shared 包中未定義的類型）
interface BatchOperationResponse {
  success: boolean;
  data: {
    processed: number;
    successful: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
    results: TransactionGroupWithEntries[];
  };
  message?: string;
}

interface TransactionValidationResponse {
  success: boolean;
  data: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    balanceCheck: {
      totalDebit: number;
      totalCredit: number;
      isBalanced: boolean;
      difference: number;
    };
  };
  message?: string;
}

interface ProgressCallback {
  (progress: { current: number; total: number; percentage: number; message?: string }): void;
}

/**
 * 交易 API 客戶端類
 */
export class TransactionApiClient {
  private readonly baseUrl: string = '/api/accounting2/transactions';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout: number = 3 * 60 * 1000; // 3 分鐘快取（交易資料變動較頻繁）

  /**
   * 清除快取
   */
  private clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * 獲取快取資料
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 設定快取資料
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 統一錯誤處理
   */
  private handleError(error: any, operation: string): never {
    console.error(`${operation} 失敗:`, error);
    const message = error.response?.data?.message ?? `${operation} 失敗`;
    throw new Error(message);
  }

  /**
   * 格式化日期參數
   */
  private formatDateParam(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  }

  /**
   * 獲取交易列表
   */
  async getTransactions(filters: TransactionGroupFilter = {}): Promise<TransactionGroupListResponse> {
    try {
      const formattedFilters = {
        ...filters,
        startDate: this.formatDateParam(filters.startDate),
        endDate: this.formatDateParam(filters.endDate)
      };

      const cacheKey = `transactions_${JSON.stringify(formattedFilters)}`;
      const cached = this.getFromCache<TransactionGroupListResponse>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(this.baseUrl, { params: formattedFilters });
      const result = response.data as TransactionGroupListResponse;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, '獲取交易列表');
    }
  }

  /**
   * 獲取單一交易詳情
   */
  async getTransactionById(id: string): Promise<TransactionGroupDetailResponse> {
    try {
      const cacheKey = `transaction_${id}`;
      const cached = this.getFromCache<TransactionGroupDetailResponse>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/${id}`);
      const result = response.data as TransactionGroupDetailResponse;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, `獲取交易詳情 ${id}`);
    }
  }

  /**
   * 建立新交易
   */
  async createTransaction(transactionData: Partial<TransactionGroupWithEntries>): Promise<TransactionGroupDetailResponse> {
    try {
      const response = await apiService.post(this.baseUrl, transactionData);
      const result = response.data as TransactionGroupDetailResponse;
      
      // 清除相關快取
      this.clearCache('transactions');
      
      return result;
    } catch (error) {
      return this.handleError(error, '建立交易');
    }
  }

  /**
   * 更新交易
   */
  async updateTransaction(id: string, transactionData: Partial<TransactionGroupWithEntries>): Promise<TransactionGroupDetailResponse> {
    try {
      const response = await apiService.put(`${this.baseUrl}/${id}`, transactionData);
      const result = response.data as TransactionGroupDetailResponse;
      
      // 清除相關快取
      this.clearCache('transactions');
      this.clearCache(`transaction_${id}`);
      
      return result;
    } catch (error) {
      return this.handleError(error, `更新交易 ${id}`);
    }
  }

  /**
   * 刪除交易
   */
  async deleteTransaction(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`${this.baseUrl}/${id}`);
      const result = response.data as { success: boolean; message?: string };
      
      // 清除相關快取
      this.clearCache('transactions');
      this.clearCache(`transaction_${id}`);
      
      return result;
    } catch (error) {
      return this.handleError(error, `刪除交易 ${id}`);
    }
  }

  /**
   * 確認交易
   */
  async confirmTransaction(id: string): Promise<TransactionGroupDetailResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${id}/confirm`);
      const result = response.data as TransactionGroupDetailResponse;
      
      // 清除相關快取
      this.clearCache('transactions');
      this.clearCache(`transaction_${id}`);
      
      return result;
    } catch (error) {
      return this.handleError(error, `確認交易 ${id}`);
    }
  }

  /**
   * 取消交易
   */
  async cancelTransaction(id: string, reason?: string): Promise<TransactionGroupDetailResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/${id}/cancel`, { reason });
      const result = response.data as TransactionGroupDetailResponse;
      
      // 清除相關快取
      this.clearCache('transactions');
      this.clearCache(`transaction_${id}`);
      
      return result;
    } catch (error) {
      return this.handleError(error, `取消交易 ${id}`);
    }
  }

  /**
   * 驗證交易分錄
   */
  async validateTransaction(transactionData: Partial<TransactionGroupWithEntries>): Promise<TransactionValidationResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/validate`, transactionData);
      return response.data as TransactionValidationResponse;
    } catch (error) {
      return this.handleError(error, '驗證交易');
    }
  }

  /**
   * 批次建立交易
   */
  async batchCreateTransactions(
    transactionsData: Partial<TransactionGroupWithEntries>[],
    onProgress?: ProgressCallback
  ): Promise<BatchOperationResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/batch`, 
        { transactions: transactionsData },
        {
          onUploadProgress: (progressEvent: any) => {
            if (onProgress && progressEvent.total) {
              const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress({
                current: progressEvent.loaded,
                total: progressEvent.total,
                percentage,
                message: `上傳中... ${percentage}%`
              });
            }
          }
        }
      );
      
      const result = response.data as BatchOperationResponse;
      
      // 清除相關快取
      this.clearCache();
      
      return result;
    } catch (error) {
      return this.handleError(error, '批次建立交易');
    }
  }

  /**
   * 批次更新交易
   */
  async batchUpdateTransactions(
    updates: { id: string; data: Partial<TransactionGroupWithEntries> }[],
    onProgress?: ProgressCallback
  ): Promise<BatchOperationResponse> {
    try {
      const response = await apiService.put(`${this.baseUrl}/batch`, 
        { updates },
        {
          onUploadProgress: (progressEvent: any) => {
            if (onProgress && progressEvent.total) {
              const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress({
                current: progressEvent.loaded,
                total: progressEvent.total,
                percentage,
                message: `更新中... ${percentage}%`
              });
            }
          }
        }
      );
      
      const result = response.data as BatchOperationResponse;
      
      // 清除相關快取
      this.clearCache();
      
      return result;
    } catch (error) {
      return this.handleError(error, '批次更新交易');
    }
  }

  /**
   * 批次確認交易
   */
  async batchConfirmTransactions(
    transactionIds: string[],
    onProgress?: ProgressCallback
  ): Promise<BatchOperationResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/batch-confirm`, 
        { transactionIds },
        {
          onUploadProgress: (progressEvent: any) => {
            if (onProgress && progressEvent.total) {
              const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress({
                current: progressEvent.loaded,
                total: progressEvent.total,
                percentage,
                message: `確認中... ${percentage}%`
              });
            }
          }
        }
      );
      
      const result = response.data as BatchOperationResponse;
      
      // 清除相關快取
      this.clearCache();
      
      return result;
    } catch (error) {
      return this.handleError(error, '批次確認交易');
    }
  }

  /**
   * 搜尋交易
   */
  async searchTransactions(keyword: string, filters: Omit<TransactionGroupFilter, 'keyword'> = {}): Promise<TransactionGroupListResponse> {
    try {
      const searchFilters = { 
        ...filters, 
        keyword,
        startDate: this.formatDateParam(filters.startDate),
        endDate: this.formatDateParam(filters.endDate)
      };
      const response = await apiService.get(`${this.baseUrl}/search`, { params: searchFilters });
      return response.data as TransactionGroupListResponse;
    } catch (error) {
      return this.handleError(error, '搜尋交易');
    }
  }

  /**
   * 匯出交易資料
   */
  async exportTransactions(
    format: 'csv' | 'excel' | 'pdf' = 'csv', 
    filters: TransactionGroupFilter = {}
  ): Promise<Blob> {
    try {
      const formattedFilters = {
        ...filters,
        format,
        startDate: this.formatDateParam(filters.startDate),
        endDate: this.formatDateParam(filters.endDate)
      };
      
      const response = await apiService.get(`${this.baseUrl}/export`, {
        params: formattedFilters,
        responseType: 'blob'
      });
      return response.data as Blob;
    } catch (error) {
      return this.handleError(error, '匯出交易資料');
    }
  }

  /**
   * 獲取交易統計
   */
  async getTransactionStatistics(filters: Omit<TransactionGroupFilter, 'page' | 'limit'> = {}): Promise<{
    success: boolean;
    data: {
      totalTransactions: number;
      totalAmount: number;
      averageAmount: number;
      statusBreakdown: Record<string, number>;
      monthlyTrend: Array<{ month: string; count: number; amount: number }>;
      topAccounts: Array<{ accountId: string; accountName: string; transactionCount: number; totalAmount: number }>;
    };
    message?: string;
  }> {
    try {
      const formattedFilters = {
        ...filters,
        startDate: this.formatDateParam(filters.startDate),
        endDate: this.formatDateParam(filters.endDate)
      };
      
      const cacheKey = `transaction_stats_${JSON.stringify(formattedFilters)}`;
      const cached = this.getFromCache<any>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/statistics`, { params: formattedFilters });
      const result = response.data;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, '獲取交易統計');
    }
  }

  /**
   * 手動清除快取
   */
  clearAllCache(): void {
    this.clearCache();
  }

  /**
   * 獲取快取統計
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * 建立交易 API 客戶端實例
 */
export const createTransactionApiClient = (): TransactionApiClient => {
  return new TransactionApiClient();
};

/**
 * 預設交易 API 客戶端實例
 */
export const transactionApiClient = createTransactionApiClient();

export default transactionApiClient;