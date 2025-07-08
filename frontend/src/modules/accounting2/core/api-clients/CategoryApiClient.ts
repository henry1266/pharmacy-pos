import { 
  Category2, 
  Category2FormData,
  Category2ListResponse,
  Category2DetailResponse,
  CategoryReorderItem,
  ApiResponse 
} from '@pharmacy-pos/shared/types/accounting2';
import apiService from '../../../../utils/apiService';

/**
 * CategoryApiClient - 類別管理 API 客戶端
 * 
 * 提供類別相關的 API 調用功能，包括：
 * - CRUD 操作（建立、讀取、更新、刪除）
 * - 類型篩選（收入/支出類別）
 * - 排序功能
 * - 快取管理
 * 
 * 使用現有的 /api/categories 端點（categories2.ts）
 */
export class CategoryApiClient {
  private readonly baseUrl = '/api/categories';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 4 * 60 * 1000; // 4分鐘快取

  /**
   * 清除快取
   */
  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * 獲取快取鍵
   */
  private getCacheKey(method: string, params?: any): string {
    return `${method}_${JSON.stringify(params || {})}`;
  }

  /**
   * 檢查快取是否有效
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  /**
   * 獲取快取資料
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as T;
    }
    return null;
  }

  /**
   * 設定快取資料
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 統一錯誤處理
   */
  private handleError(error: any, operation: string): never {
    console.error(`CategoryApiClient ${operation} 錯誤:`, error);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error(`${operation}失敗`);
  }

  /**
   * 獲取所有類別
   * @param params 查詢參數
   * @returns 類別列表
   */
  async getCategories(params?: {
    type?: 'income' | 'expense';
    organizationId?: string;
  }): Promise<Category2ListResponse> {
    try {
      const cacheKey = this.getCacheKey('getCategories', params);
      const cached = this.getFromCache<Category2ListResponse>(cacheKey);
      
      if (cached) {
        console.log('🎯 CategoryApiClient 使用快取資料');
        return cached;
      }

      console.log('🔍 CategoryApiClient 獲取類別列表:', params);
      
      const response = await apiService.get(this.baseUrl, { params });
      const result = response.data as Category2ListResponse;
      
      if (result.success) {
        this.setCache(cacheKey, result);
        console.log('✅ CategoryApiClient 獲取類別成功:', result.data.length, '個類別');
      }
      
      return result;
    } catch (error) {
      this.handleError(error, '獲取類別列表');
    }
  }

  /**
   * 獲取收入類別
   * @returns 收入類別列表
   */
  async getIncomeCategories(): Promise<Category2ListResponse> {
    try {
      const cacheKey = this.getCacheKey('getIncomeCategories');
      const cached = this.getFromCache<Category2ListResponse>(cacheKey);
      
      if (cached) {
        console.log('🎯 CategoryApiClient 使用收入類別快取資料');
        return cached;
      }

      console.log('🔍 CategoryApiClient 獲取收入類別');
      
      const response = await apiService.get(`${this.baseUrl}/income`);
      const result = response.data as Category2ListResponse;
      
      if (result.success) {
        this.setCache(cacheKey, result);
        console.log('✅ CategoryApiClient 獲取收入類別成功:', result.data.length, '個類別');
      }
      
      return result;
    } catch (error) {
      this.handleError(error, '獲取收入類別');
    }
  }

  /**
   * 獲取支出類別
   * @returns 支出類別列表
   */
  async getExpenseCategories(): Promise<Category2ListResponse> {
    try {
      const cacheKey = this.getCacheKey('getExpenseCategories');
      const cached = this.getFromCache<Category2ListResponse>(cacheKey);
      
      if (cached) {
        console.log('🎯 CategoryApiClient 使用支出類別快取資料');
        return cached;
      }

      console.log('🔍 CategoryApiClient 獲取支出類別');
      
      const response = await apiService.get(`${this.baseUrl}/expense`);
      const result = response.data as Category2ListResponse;
      
      if (result.success) {
        this.setCache(cacheKey, result);
        console.log('✅ CategoryApiClient 獲取支出類別成功:', result.data.length, '個類別');
      }
      
      return result;
    } catch (error) {
      this.handleError(error, '獲取支出類別');
    }
  }

  /**
   * 獲取單一類別詳情
   * @param id 類別ID
   * @returns 類別詳情
   */
  async getCategoryById(id: string): Promise<Category2DetailResponse> {
    try {
      const cacheKey = this.getCacheKey('getCategoryById', { id });
      const cached = this.getFromCache<Category2DetailResponse>(cacheKey);
      
      if (cached) {
        console.log('🎯 CategoryApiClient 使用類別詳情快取資料');
        return cached;
      }

      console.log('🔍 CategoryApiClient 獲取類別詳情:', id);
      
      const response = await apiService.get(`${this.baseUrl}/${id}`);
      const result = response.data as Category2DetailResponse;
      
      if (result.success) {
        this.setCache(cacheKey, result);
        console.log('✅ CategoryApiClient 獲取類別詳情成功');
      }
      
      return result;
    } catch (error) {
      this.handleError(error, '獲取類別詳情');
    }
  }

  /**
   * 建立新類別
   * @param data 類別資料
   * @returns 建立結果
   */
  async createCategory(data: Category2FormData): Promise<Category2DetailResponse> {
    try {
      console.log('📤 CategoryApiClient 建立類別:', data);
      
      const response = await apiService.post(this.baseUrl, data);
      const result = response.data as Category2DetailResponse;
      
      if (result.success) {
        // 清除相關快取
        this.clearCache();
        console.log('✅ CategoryApiClient 建立類別成功');
      }
      
      return result;
    } catch (error) {
      this.handleError(error, '建立類別');
    }
  }

  /**
   * 更新類別
   * @param id 類別ID
   * @param data 更新資料
   * @returns 更新結果
   */
  async updateCategory(id: string, data: Partial<Category2FormData>): Promise<Category2DetailResponse> {
    try {
      console.log('📤 CategoryApiClient 更新類別:', id, data);
      
      const response = await apiService.put(`${this.baseUrl}/${id}`, data);
      const result = response.data as Category2DetailResponse;
      
      if (result.success) {
        // 清除相關快取
        this.clearCache();
        console.log('✅ CategoryApiClient 更新類別成功');
      }
      
      return result;
    } catch (error) {
      this.handleError(error, '更新類別');
    }
  }

  /**
   * 刪除類別
   * @param id 類別ID
   * @returns 刪除結果
   */
  async deleteCategory(id: string): Promise<ApiResponse> {
    try {
      console.log('🗑️ CategoryApiClient 刪除類別:', id);
      
      const response = await apiService.delete(`${this.baseUrl}/${id}`);
      const result = response.data as ApiResponse;
      
      if (result.success) {
        // 清除相關快取
        this.clearCache();
        console.log('✅ CategoryApiClient 刪除類別成功');
      }
      
      return result;
    } catch (error) {
      this.handleError(error, '刪除類別');
    }
  }

  /**
   * 重新排序類別
   * @param categories 排序資料
   * @returns 排序結果
   */
  async reorderCategories(categories: CategoryReorderItem[]): Promise<ApiResponse> {
    try {
      console.log('🔄 CategoryApiClient 重新排序類別:', categories.length, '個類別');
      
      const response = await apiService.put(`${this.baseUrl}/reorder`, { categories });
      const result = response.data as ApiResponse;
      
      if (result.success) {
        // 清除相關快取
        this.clearCache();
        console.log('✅ CategoryApiClient 重新排序成功');
      }
      
      return result;
    } catch (error) {
      this.handleError(error, '重新排序類別');
    }
  }

  /**
   * 獲取快取統計資訊
   * @returns 快取統計
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 手動清除所有快取
   */
  clearAllCache(): void {
    this.clearCache();
    console.log('🧹 CategoryApiClient 快取已清除');
  }
}

// 工廠函數
export const createCategoryApiClient = (): CategoryApiClient => {
  return new CategoryApiClient();
};

// 建立單例實例
export const categoryApiClient = new CategoryApiClient();

// 預設匯出
export default categoryApiClient;