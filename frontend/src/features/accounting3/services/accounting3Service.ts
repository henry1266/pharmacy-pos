import apiService from '../../../utils/apiService';
import {
  Account3,
  Category3,
  Account3FormData,
  Category3FormData,
  AccountingEntry3FormData,
  Account3ListResponse,
  Account3DetailResponse,
  Category3ListResponse,
  Category3DetailResponse,
  AccountingEntry3ListResponse,
  AccountingEntry3DetailResponse,
  AccountingEntry3Filter,
  ApiResponse3
} from '@pharmacy-pos/shared/types/accounting3';

// 導入遷移適配器（僅在遷移期間使用）
import { 
  OrganizationHierarchyBuilder,
  TransactionDataProcessor,
  LEGACY_API_PATHS,
  type AccountBalance,
  type CategoryReorderItem,
  type AccountingRecord2SummaryResponse
} from './legacyAdapter';

/**
 * Accounting3 Service - 現代化會計系統服務
 * 
 * 提供純淨的 accounting3 API 介面，移除了大部分相容性代碼
 * 遷移期間的相容性邏輯已移至 legacyAdapter.ts
 */

// 統一的 API 基礎路徑
const API_BASE = '/api/accounting3';

// 帳戶管理 API - 使用統一的 accounting3 路徑
export const accountsApi = {
  /**
   * 獲取所有帳戶 - 支援階層查詢
   * @param organizationId 可選的組織ID篩選
   */
  getAll: async (organizationId?: string | null): Promise<Account3ListResponse> => {
    try {
      if (organizationId) {
        // 指定組織的科目樹狀結構
        const response = await apiService.get(LEGACY_API_PATHS.accounts.hierarchy, { 
          params: { organizationId } 
        });
        return {
          success: response.data?.success || true,
          data: response.data?.data || []
        };
      } else {
        // 完整的組織-科目階層結構（遷移期間使用 legacy 邏輯）
        console.log('🔄 使用 Legacy 適配器建立組織階層');
        const organizationTrees = await OrganizationHierarchyBuilder.buildOrganizationAccountHierarchy();
        return {
          success: true,
          data: organizationTrees
        };
      }
    } catch (error) {
      console.error('獲取帳戶列表失敗:', error);
      // 降級處理
      const response = await apiService.get(LEGACY_API_PATHS.accounts.hierarchy);
      return response.data;
    }
  },

  /**
   * 獲取單一帳戶
   */
  getById: async (id: string): Promise<Account3DetailResponse> => {
    const response = await apiService.get(LEGACY_API_PATHS.accounts.detail(id));
    return response.data;
  },

  /**
   * 新增帳戶
   */
  create: async (data: Account3FormData): Promise<Account3DetailResponse> => {
    const response = await apiService.post(LEGACY_API_PATHS.accounts.create, data);
    return response.data;
  },

  /**
   * 更新帳戶
   */
  update: async (id: string, data: Partial<Account3FormData>): Promise<Account3DetailResponse> => {
    const response = await apiService.put(LEGACY_API_PATHS.accounts.update(id), data);
    return response.data;
  },

  /**
   * 刪除帳戶
   */
  delete: async (id: string): Promise<ApiResponse3> => {
    const response = await apiService.delete(LEGACY_API_PATHS.accounts.delete(id));
    return response.data;
  },

  /**
   * 獲取帳戶餘額
   */
  getBalance: async (id: string): Promise<{ success: boolean; data: AccountBalance }> => {
    const response = await apiService.get(LEGACY_API_PATHS.accounts.balance(id));
    return response.data;
  },

  /**
   * 調整帳戶餘額
   */
  updateBalance: async (id: string, balance: number): Promise<{ success: boolean; data: AccountBalance; message: string }> => {
    const response = await apiService.put(LEGACY_API_PATHS.accounts.updateBalance(id), { balance });
    return response.data;
  }
};

// 類別管理 API - 使用統一的 accounting3 路徑
export const categoriesApi = {
  /**
   * 獲取所有類別
   */
  getAll: async (params?: { type?: 'income' | 'expense'; organizationId?: string }): Promise<Category3ListResponse> => {
    const response = await apiService.get(LEGACY_API_PATHS.categories.list, { params });
    return response.data;
  },

  /**
   * 獲取收入類別
   */
  getIncome: async (): Promise<Category3ListResponse> => {
    const response = await apiService.get(LEGACY_API_PATHS.categories.income);
    return response.data;
  },

  /**
   * 獲取支出類別
   */
  getExpense: async (): Promise<Category3ListResponse> => {
    const response = await apiService.get(LEGACY_API_PATHS.categories.expense);
    return response.data;
  },

  /**
   * 獲取單一類別
   */
  getById: async (id: string): Promise<Category3DetailResponse> => {
    const response = await apiService.get(LEGACY_API_PATHS.categories.detail(id));
    return response.data;
  },

  /**
   * 新增類別
   */
  create: async (data: Category3FormData): Promise<Category3DetailResponse> => {
    const response = await apiService.post(LEGACY_API_PATHS.categories.create, data);
    return response.data;
  },

  /**
   * 更新類別
   */
  update: async (id: string, data: Partial<Category3FormData>): Promise<Category3DetailResponse> => {
    const response = await apiService.put(LEGACY_API_PATHS.categories.update(id), data);
    return response.data;
  },

  /**
   * 刪除類別
   */
  delete: async (id: string): Promise<ApiResponse3> => {
    const response = await apiService.delete(LEGACY_API_PATHS.categories.delete(id));
    return response.data;
  },

  /**
   * 重新排序類別
   */
  reorder: async (categories: CategoryReorderItem[]): Promise<ApiResponse3> => {
    const response = await apiService.put(LEGACY_API_PATHS.categories.reorder, { categories });
    return response.data;
  }
};

// 記帳記錄 API - 使用統一的 accounting3 路徑
export const recordsApi = {
  /**
   * 獲取記帳記錄列表
   */
  getAll: async (filter?: AccountingEntry3Filter): Promise<AccountingEntry3ListResponse> => {
    const response = await apiService.get(LEGACY_API_PATHS.records.list, { params: filter });
    return response.data;
  },

  /**
   * 獲取記帳摘要
   */
  getSummary: async (startDate?: string, endDate?: string): Promise<AccountingRecord2SummaryResponse> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiService.get(LEGACY_API_PATHS.records.summary, { params });
    return response.data;
  },

  /**
   * 獲取單一記帳記錄
   */
  getById: async (id: string): Promise<AccountingEntry3DetailResponse> => {
    const response = await apiService.get(LEGACY_API_PATHS.records.detail(id));
    return response.data;
  },

  /**
   * 新增記帳記錄
   */
  create: async (data: AccountingEntry3FormData): Promise<AccountingEntry3DetailResponse> => {
    const response = await apiService.post(LEGACY_API_PATHS.records.create, data);
    return response.data;
  },

  /**
   * 更新記帳記錄
   */
  update: async (id: string, data: Partial<AccountingEntry3FormData>): Promise<AccountingEntry3DetailResponse> => {
    const response = await apiService.put(LEGACY_API_PATHS.records.update(id), data);
    return response.data;
  },

  /**
   * 刪除記帳記錄
   */
  delete: async (id: string): Promise<ApiResponse3> => {
    const response = await apiService.delete(LEGACY_API_PATHS.records.delete(id));
    return response.data;
  }
};

// 交易管理 API - 使用統一的 accounting3 路徑
export const transactionsApi = {
  /**
   * 獲取所有交易
   */
  getAll: async (filter?: {
    accountId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; total?: number }> => {
    const response = await apiService.get(LEGACY_API_PATHS.transactions.list, { params: filter });
    return response.data;
  },

  /**
   * 獲取科目相關交易 - 使用優化的過濾邏輯
   */
  getByAccount: async (accountId: string, filter?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: any[]; total?: number }> => {
    try {
      console.log('🔍 getByAccount 開始查詢:', { accountId, filter });
      
      const params = {
        ...filter,
        page: filter?.page || 1,
        limit: filter?.limit || 10000
      };
      
      const response = await apiService.get(LEGACY_API_PATHS.transactions.list, { params });
      
      // 使用 Legacy 適配器處理回應格式
      const processedResponse = TransactionDataProcessor.processTransactionResponse(response);
      
      if (!processedResponse.success) {
        return { success: false, data: [] };
      }
      
      console.log('📊 原始交易數量:', processedResponse.data.length);
      
      // 使用 Legacy 適配器過濾交易
      const filteredTransactions = TransactionDataProcessor.filterTransactionsByAccount(
        processedResponse.data, 
        accountId
      );
      
      console.log('✅ 過濾後交易數量:', filteredTransactions.length);
      
      return {
        success: true,
        data: filteredTransactions,
        total: filteredTransactions.length
      };
      
    } catch (error) {
      console.error('❌ 獲取科目交易失敗:', error);
      return { success: false, data: [] };
    }
  },

  /**
   * 獲取單一交易
   */
  getById: async (id: string): Promise<{ success: boolean; data?: any }> => {
    const response = await apiService.get(LEGACY_API_PATHS.transactions.detail(id));
    return response.data;
  },

  /**
   * 計算交易餘額
   */
  getBalance: async (id: string): Promise<{ success: boolean; data?: any }> => {
    const response = await apiService.get(LEGACY_API_PATHS.transactions.balance(id));
    return response.data;
  },

  /**
   * 批次計算交易餘額
   */
  calculateBalances: async (transactionIds: string[]): Promise<{ success: boolean; data?: any }> => {
    const response = await apiService.post(LEGACY_API_PATHS.transactions.calculateBalances, {
      transactionIds
    });
    return response.data;
  },

  /**
   * 新增交易
   */
  create: async (data: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await apiService.post(LEGACY_API_PATHS.transactions.create, data);
    return response.data;
  },

  /**
   * 更新交易
   */
  update: async (id: string, data: any): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await apiService.put(LEGACY_API_PATHS.transactions.update(id), data);
    return response.data;
  },

  /**
   * 確認交易
   */
  confirm: async (id: string): Promise<{ success: boolean; data?: any; message?: string }> => {
    const response = await apiService.post(LEGACY_API_PATHS.transactions.confirm(id));
    return response.data;
  },

  /**
   * 刪除交易
   */
  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiService.delete(LEGACY_API_PATHS.transactions.delete(id));
    return response.data;
  },

  /**
   * 高效能聚合統計 API
   */
  getAccountStatisticsAggregate: async (organizationId?: string): Promise<{ success: boolean; data: any[]; meta?: any }> => {
    try {
      console.log('🚀 開始調用聚合統計 API:', { organizationId });
      
      const params = new URLSearchParams();
      if (organizationId) {
        params.append('organizationId', organizationId);
      }
      
      const url = `${LEGACY_API_PATHS.transactions.accountStatistics}${params.toString() ? '?' + params.toString() : ''}`;
      console.log('📡 請求 URL:', url);
      
      const response = await apiService.get(url);
      
      console.log('✅ 聚合統計 API 回應:', {
        status: response.status,
        success: response.data?.success,
        dataLength: response.data?.data?.length,
        queryTime: response.data?.meta?.queryTime
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ 聚合統計 API 調用失敗:', error);
      return { success: false, data: [] };
    }
  }
};

// 資金來源追蹤 API
export const fundingTrackingApi = {
  /**
   * 獲取可用的資金來源
   */
  getAvailableFundingSources: async (params?: {
    organizationId?: string;
    minAmount?: number;
  }): Promise<{ success: boolean; data?: { fundingSources: any[] } }> => {
    try {
      console.log('[Accounting3] 🔍 獲取可用資金來源:', params);
      const response = await apiService.get(LEGACY_API_PATHS.funding.availableSources, { params });
      return response.data;
    } catch (error) {
      console.error('[Accounting3] 獲取資金來源失敗:', error);
      return { success: false, data: { fundingSources: [] } };
    }
  }
};

/**
 * 統一的 accounting3 服務導出
 * 
 * 提供清晰的 API 介面，隱藏內部實作細節
 * 遷移期間暫時保留部分 legacy 方法以確保相容性
 */
export const accounting3Service = {
  // 核心 API 模組
  accounts: accountsApi,
  categories: categoriesApi,
  records: recordsApi,
  transactions: transactionsApi,
  funding: fundingTrackingApi,
  
  // 便捷方法（向後相容）
  getAvailableFundingSources: fundingTrackingApi.getAvailableFundingSources,
  getAll: transactionsApi.getAll,
  confirm: transactionsApi.confirm,
  
  // 遷移期間的 Legacy 支援（標記為 deprecated）
  /** @deprecated 請使用 transactions.getAll() 替代 */
  getAllTransactions: transactionsApi.getAll,
  /** @deprecated 請使用 transactions.confirm() 替代 */
  confirmTransaction: transactionsApi.confirm
};

export default accounting3Service;

/**
 * 型別導出 - 提供給外部使用
 */
export type {
  Account3,
  Category3,
  Account3FormData,
  Category3FormData,
  AccountingEntry3FormData,
  Account3ListResponse,
  Account3DetailResponse,
  Category3ListResponse,
  Category3DetailResponse,
  AccountingEntry3ListResponse,
  AccountingEntry3DetailResponse,
  AccountingEntry3Filter,
  ApiResponse3
};

/**
 * Legacy 型別導出 - 遷移期間使用
 * @deprecated 這些型別將在 v4.0 移除，請使用對應的 Account3 型別
 */
export type {
  AccountBalance,
  CategoryReorderItem,
  AccountingRecord2SummaryResponse
} from './legacyAdapter';