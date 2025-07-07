/**
 * Accounting2 資金追蹤 API 客戶端
 * 提供資金來源相關的 API 調用方法，包含驗證和流向分析功能
 */

import apiService from '../../../../utils/apiService';
import type {
  FundingSource,
  FundingFlowData,
  FundingSourcesResponse,
  FundingFlowResponse,
  FundingValidationResponse
} from '@pharmacy-pos/shared';

// 本地介面定義（shared 包中未定義的類型）
interface FundingSearchFilters {
  organizationId?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: 'active' | 'exhausted' | 'locked';
  isAvailable?: boolean;
  startDate?: string | Date;
  endDate?: string | Date;
  keyword?: string;
  page?: number;
  limit?: number;
  sortBy?: 'transactionDate' | 'availableAmount' | 'usageRate' | 'groupNumber';
  sortOrder?: 'asc' | 'desc';
}

interface FundingAllocationRequest {
  sourceTransactionIds: string[];
  requiredAmount: number;
  targetTransactionId?: string;
  allocationStrategy?: 'fifo' | 'lifo' | 'optimal' | 'manual';
  manualAllocations?: Array<{
    sourceId: string;
    amount: number;
  }>;
}

interface FundingAllocationResponse {
  success: boolean;
  data: {
    allocations: Array<{
      sourceId: string;
      groupNumber: string;
      allocatedAmount: number;
      remainingAmount: number;
    }>;
    totalAllocated: number;
    totalRemaining: number;
    allocationStrategy: string;
  };
  message?: string;
}

/**
 * 資金追蹤 API 客戶端類
 */
export class FundingApiClient {
  private readonly baseUrl: string = '/api/accounting2/funding';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout: number = 2 * 60 * 1000; // 2 分鐘快取（資金狀態變動頻繁）

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
   * 獲取可用的資金來源
   */
  async getAvailableFundingSources(filters: FundingSearchFilters = {}): Promise<FundingSourcesResponse> {
    try {
      const formattedFilters = {
        ...filters,
        startDate: this.formatDateParam(filters.startDate),
        endDate: this.formatDateParam(filters.endDate)
      };

      const cacheKey = `available_sources_${JSON.stringify(formattedFilters)}`;
      const cached = this.getFromCache<FundingSourcesResponse>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/available-sources`, { params: formattedFilters });
      const result = response.data as FundingSourcesResponse;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, '獲取可用資金來源');
    }
  }

  /**
   * 獲取所有資金來源（包含已用完的）
   */
  async getAllFundingSources(filters: FundingSearchFilters = {}): Promise<FundingSourcesResponse> {
    try {
      const formattedFilters = {
        ...filters,
        startDate: this.formatDateParam(filters.startDate),
        endDate: this.formatDateParam(filters.endDate)
      };

      const cacheKey = `all_sources_${JSON.stringify(formattedFilters)}`;
      const cached = this.getFromCache<FundingSourcesResponse>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/sources`, { params: formattedFilters });
      const result = response.data as FundingSourcesResponse;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, '獲取所有資金來源');
    }
  }

  /**
   * 獲取單一資金來源詳情
   */
  async getFundingSourceById(id: string): Promise<{ success: boolean; data: FundingSource; message?: string }> {
    try {
      const cacheKey = `funding_source_${id}`;
      const cached = this.getFromCache<any>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/sources/${id}`);
      const result = response.data;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, `獲取資金來源詳情 ${id}`);
    }
  }

  /**
   * 獲取資金流向追蹤
   */
  async getFundingFlow(transactionId: string): Promise<FundingFlowResponse> {
    try {
      const cacheKey = `funding_flow_${transactionId}`;
      const cached = this.getFromCache<FundingFlowResponse>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/flow/${transactionId}`);
      const result = response.data as FundingFlowResponse;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, `獲取資金流向 ${transactionId}`);
    }
  }

  /**
   * 驗證資金來源可用性
   */
  async validateFundingSources(request: FundingAllocationRequest): Promise<FundingValidationResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/validate-sources`, request);
      return response.data as FundingValidationResponse;
    } catch (error) {
      return this.handleError(error, '驗證資金來源');
    }
  }

  /**
   * 分配資金來源
   */
  async allocateFundingSources(request: FundingAllocationRequest): Promise<FundingAllocationResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/allocate-sources`, request);
      const result = response.data as FundingAllocationResponse;
      
      // 清除相關快取
      this.clearCache('sources');
      this.clearCache('flow');
      
      return result;
    } catch (error) {
      return this.handleError(error, '分配資金來源');
    }
  }

  /**
   * 釋放資金來源分配
   */
  async releaseFundingAllocation(transactionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/release-allocation/${transactionId}`);
      const result = response.data as { success: boolean; message?: string };
      
      // 清除相關快取
      this.clearCache('sources');
      this.clearCache('flow');
      
      return result;
    } catch (error) {
      return this.handleError(error, `釋放資金分配 ${transactionId}`);
    }
  }

  /**
   * 搜尋資金來源
   */
  async searchFundingSources(keyword: string, filters: Omit<FundingSearchFilters, 'keyword'> = {}): Promise<FundingSourcesResponse> {
    try {
      const searchFilters = { 
        ...filters, 
        keyword,
        startDate: this.formatDateParam(filters.startDate),
        endDate: this.formatDateParam(filters.endDate)
      };
      const response = await apiService.get(`${this.baseUrl}/search`, { params: searchFilters });
      return response.data as FundingSourcesResponse;
    } catch (error) {
      return this.handleError(error, '搜尋資金來源');
    }
  }

  /**
   * 獲取資金使用統計
   */
  async getFundingStatistics(filters: Omit<FundingSearchFilters, 'page' | 'limit'> = {}): Promise<{
    success: boolean;
    data: {
      totalSources: number;
      totalAmount: number;
      totalUsed: number;
      totalAvailable: number;
      averageUsageRate: number;
      statusBreakdown: Record<string, number>;
      organizationBreakdown: Array<{
        organizationId: string;
        organizationName: string;
        sourceCount: number;
        totalAmount: number;
        usageRate: number;
      }>;
      monthlyTrend: Array<{
        month: string;
        newSources: number;
        totalAmount: number;
        usageRate: number;
      }>;
      topSources: Array<{
        transactionId: string;
        groupNumber: string;
        totalAmount: number;
        usageRate: number;
        linkedCount: number;
      }>;
    };
    message?: string;
  }> {
    try {
      const formattedFilters = {
        ...filters,
        startDate: this.formatDateParam(filters.startDate),
        endDate: this.formatDateParam(filters.endDate)
      };
      
      const cacheKey = `funding_stats_${JSON.stringify(formattedFilters)}`;
      const cached = this.getFromCache<any>(cacheKey);
      if (cached) return cached;

      const response = await apiService.get(`${this.baseUrl}/statistics`, { params: formattedFilters });
      const result = response.data;
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      return this.handleError(error, '獲取資金統計');
    }
  }

  /**
   * 獲取資金分配建議
   */
  async getFundingRecommendations(requiredAmount: number, filters: FundingSearchFilters = {}): Promise<{
    success: boolean;
    data: {
      recommendations: Array<{
        strategy: 'single' | 'multiple' | 'split';
        sources: Array<{
          sourceId: string;
          groupNumber: string;
          suggestedAmount: number;
          availableAmount: number;
          priority: number;
          reason: string;
        }>;
        totalAmount: number;
        efficiency: number;
        riskLevel: 'low' | 'medium' | 'high';
        description: string;
      }>;
      optimalStrategy: string;
    };
    message?: string;
  }> {
    try {
      const formattedFilters = {
        ...filters,
        requiredAmount,
        startDate: this.formatDateParam(filters.startDate),
        endDate: this.formatDateParam(filters.endDate)
      };
      
      const response = await apiService.get(`${this.baseUrl}/recommendations`, { params: formattedFilters });
      return response.data;
    } catch (error) {
      return this.handleError(error, '獲取資金分配建議');
    }
  }

  /**
   * 鎖定資金來源（暫時保留）
   */
  async lockFundingSource(sourceId: string, lockDuration: number = 300): Promise<{ success: boolean; message?: string; lockExpiry?: Date }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/sources/${sourceId}/lock`, { lockDuration });
      const result = response.data as { success: boolean; message?: string; lockExpiry?: Date };
      
      // 清除相關快取
      this.clearCache('sources');
      this.clearCache(`funding_source_${sourceId}`);
      
      return result;
    } catch (error) {
      return this.handleError(error, `鎖定資金來源 ${sourceId}`);
    }
  }

  /**
   * 解鎖資金來源
   */
  async unlockFundingSource(sourceId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.post(`${this.baseUrl}/sources/${sourceId}/unlock`);
      const result = response.data as { success: boolean; message?: string };
      
      // 清除相關快取
      this.clearCache('sources');
      this.clearCache(`funding_source_${sourceId}`);
      
      return result;
    } catch (error) {
      return this.handleError(error, `解鎖資金來源 ${sourceId}`);
    }
  }

  /**
   * 匯出資金來源資料
   */
  async exportFundingSources(
    format: 'csv' | 'excel' | 'pdf' = 'csv', 
    filters: FundingSearchFilters = {}
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
      return this.handleError(error, '匯出資金來源資料');
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
 * 建立資金追蹤 API 客戶端實例
 */
export const createFundingApiClient = (): FundingApiClient => {
  return new FundingApiClient();
};

/**
 * 預設資金追蹤 API 客戶端實例
 */
export const fundingApiClient = createFundingApiClient();

export default fundingApiClient;