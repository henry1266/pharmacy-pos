/**
 * Accounting2 科目管理 API 客戶端
 * 提供科目相關的 API 調用方法，包含錯誤處理和快取策略
 */

import apiService from '../../../../utils/apiService';
import type {
  Account2,
  Account2Filter,
  Account2ListResponse,
  Account2DetailResponse
} from '@pharmacy-pos/shared';

// 本地樹狀節點介面（暫時定義，直到 shared 包修正）
interface AccountTreeNode extends Account2 {
  children: AccountTreeNode[];
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  path: string[];
}

// 本地統計介面
interface AccountStatistics {
  totalAccounts: number;
  activeAccounts: number;
  accountsByType: Record<string, number>;
  maxLevel: number;
  lastUpdated: Date;
}

// API 客戶端專用介面
interface AccountSearchFilters extends Account2Filter {
  keyword?: string;
  page?: number;
  limit?: number;
}

interface AccountTreeResponse {
  success: boolean;
  data: AccountTreeNode[];
  message?: string;
}

interface AccountStatsResponse {
  success: boolean;
  data: AccountStatistics;
  message?: string;
}

/**
 * 科目 API 客戶端類
 */
export class AccountApiClient {
  private readonly baseUrl: string = '/api/accounting2/accounts';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout: number = 5 * 60 * 1000; // 5 分鐘快取

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
   * 獲取所有科目列表
   */
  async getAccounts(filters: AccountSearchFilters = {}): Promise<Account2ListResponse> {
    try {
      const cacheKey = `accounts_${JSON.stringify(filters)}`;
      const cached = this.getFromCache<Account2ListResponse>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(this.baseUrl, { params: filters });
      const result = response.data as Account2ListResponse;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, '獲取科目列表');
    }
  }

  /**
   * 獲取科目樹狀結構
   */
  async getAccountTree(filters: { accountType?: string; isActive?: boolean } = {}): Promise<AccountTreeResponse> {
    try {
      const cacheKey = `account_tree_${JSON.stringify(filters)}`;
      const cached = this.getFromCache<AccountTreeResponse>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/tree`, { params: filters });
      const result = response.data as AccountTreeResponse;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, '獲取科目樹狀結構');
    }
  }

  /**
   * 獲取單一科目詳情
   */
  async getAccountById(id: string): Promise<Account2DetailResponse> {
    try {
      const cacheKey = `account_${id}`;
      const cached = this.getFromCache<Account2DetailResponse>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/${id}`);
      const result = response.data as Account2DetailResponse;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, `獲取科目詳情 ${id}`);
    }
  }

  /**
   * 建立新科目
   */
  async createAccount(accountData: Partial<Account2>): Promise<Account2DetailResponse> {
    try {
      const response = await apiService.post(this.baseUrl, accountData);
      const result = response.data as Account2DetailResponse;
      
      // 清除相關快取
      this.clearCache('accounts');
      this.clearCache('account_tree');
      this.clearCache('stats');
      
      return result;
    } catch (error) {
      return this.handleError(error, '建立科目');
    }
  }

  /**
   * 更新科目
   */
  async updateAccount(id: string, accountData: Partial<Account2>): Promise<Account2DetailResponse> {
    try {
      const response = await apiService.put(`${this.baseUrl}/${id}`, accountData);
      const result = response.data as Account2DetailResponse;
      
      // 清除相關快取
      this.clearCache('accounts');
      this.clearCache('account_tree');
      this.clearCache(`account_${id}`);
      this.clearCache('stats');
      
      return result;
    } catch (error) {
      return this.handleError(error, `更新科目 ${id}`);
    }
  }

  /**
   * 刪除科目
   */
  async deleteAccount(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.delete(`${this.baseUrl}/${id}`);
      const result = response.data as { success: boolean; message?: string };
      
      // 清除相關快取
      this.clearCache('accounts');
      this.clearCache('account_tree');
      this.clearCache(`account_${id}`);
      this.clearCache('stats');
      
      return result;
    } catch (error) {
      return this.handleError(error, `刪除科目 ${id}`);
    }
  }

  /**
   * 批次建立科目
   */
  async batchCreateAccounts(accountsData: Partial<Account2>[]): Promise<Account2ListResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/batch`, { accounts: accountsData });
      const result = response.data as Account2ListResponse;
      
      // 清除相關快取
      this.clearCache();
      
      return result;
    } catch (error) {
      return this.handleError(error, '批次建立科目');
    }
  }

  /**
   * 批次更新科目
   */
  async batchUpdateAccounts(updates: { id: string; data: Partial<Account2> }[]): Promise<Account2ListResponse> {
    try {
      const response = await apiService.put(`${this.baseUrl}/batch`, { updates });
      const result = response.data as Account2ListResponse;
      
      // 清除相關快取
      this.clearCache();
      
      return result;
    } catch (error) {
      return this.handleError(error, '批次更新科目');
    }
  }

  /**
   * 搜尋科目
   */
  async searchAccounts(keyword: string, filters: Omit<AccountSearchFilters, 'keyword'> = {}): Promise<Account2ListResponse> {
    try {
      const searchFilters = { ...filters, keyword };
      const response = await apiService.get(`${this.baseUrl}/search`, { params: searchFilters });
      return response.data as Account2ListResponse;
    } catch (error) {
      return this.handleError(error, '搜尋科目');
    }
  }

  /**
   * 獲取科目統計資訊
   */
  async getAccountStatistics(): Promise<AccountStatsResponse> {
    try {
      const cacheKey = 'account_stats';
      const cached = this.getFromCache<AccountStatsResponse>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/statistics`);
      const result = response.data as AccountStatsResponse;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, '獲取科目統計');
    }
  }

  /**
   * 驗證科目編號唯一性
   */
  async validateAccountNumber(accountNumber: string, excludeId?: string): Promise<{ isValid: boolean; message?: string }> {
    try {
      const params = excludeId ? { accountNumber, excludeId } : { accountNumber };
      const response = await apiService.get(`${this.baseUrl}/validate-number`, { params });
      return response.data as { isValid: boolean; message?: string };
    } catch (error) {
      return this.handleError(error, '驗證科目編號');
    }
  }

  /**
   * 獲取子科目列表
   */
  async getChildAccounts(parentId: string): Promise<Account2ListResponse> {
    try {
      const cacheKey = `children_${parentId}`;
      const cached = this.getFromCache<Account2ListResponse>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/${parentId}/children`);
      const result = response.data as Account2ListResponse;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, `獲取子科目 ${parentId}`);
    }
  }

  /**
   * 匯出科目資料
   */
  async exportAccounts(format: 'csv' | 'excel' = 'csv', filters: AccountSearchFilters = {}): Promise<Blob> {
    try {
      const response = await apiService.get(`${this.baseUrl}/export`, {
        params: { ...filters, format },
        responseType: 'blob'
      });
      return response.data as Blob;
    } catch (error) {
      return this.handleError(error, '匯出科目資料');
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
 * 建立科目 API 客戶端實例
 */
export const createAccountApiClient = (): AccountApiClient => {
  return new AccountApiClient();
};

/**
 * 預設科目 API 客戶端實例
 */
export const accountApiClient = createAccountApiClient();

export default accountApiClient;