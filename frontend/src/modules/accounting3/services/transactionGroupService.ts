import apiService from '../../../utils/apiService';
import {
  TransactionGroupFormData,
  TransactionGroupListResponse,
  TransactionGroupDetailResponse,
  FundingSourcesResponse,
  FundingFlowResponse,
  FundingValidationResponse
} from '@pharmacy-pos/shared';

const BASE_URL = '/api/transaction-groups-with-entries';

// 交易群組基本 CRUD 操作
export const transactionGroupService = {
  // 獲取所有交易群組
  getAll: async (params?: {
    organizationId?: string;
    status?: 'draft' | 'confirmed' | 'cancelled';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<TransactionGroupListResponse> => {
    const response = await apiService.get(BASE_URL, { params });
    return response.data;
  },

  // 獲取單一交易群組詳情
  getById: async (id: string): Promise<TransactionGroupDetailResponse> => {
    const response = await apiService.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // 建立交易群組
  create: async (data: TransactionGroupFormData): Promise<TransactionGroupDetailResponse> => {
    const response = await apiService.post(BASE_URL, data);
    return response.data;
  },

  // 更新交易群組
  update: async (id: string, data: Partial<TransactionGroupFormData>): Promise<TransactionGroupDetailResponse> => {
    const response = await apiService.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  // 刪除交易群組
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  // 確認交易
  confirm: async (id: string): Promise<TransactionGroupDetailResponse> => {
    const response = await apiService.post(`${BASE_URL}/${id}/confirm`);
    return response.data;
  }
};

// 資金來源追蹤相關服務
export const fundingTrackingService = {
  // 獲取可用的資金來源
  getAvailableFundingSources: async (params?: {
    organizationId?: string;
    minAmount?: number;
  }): Promise<FundingSourcesResponse> => {
    const response = await apiService.get(`${BASE_URL}/funding/available-sources`, { params });
    return response.data;
  },

  // 獲取資金流向追蹤
  getFundingFlow: async (transactionId: string): Promise<FundingFlowResponse> => {
    const response = await apiService.get(`${BASE_URL}/${transactionId}/funding-flow`);
    return response.data;
  },

  // 驗證資金來源可用性
  validateFundingSources: async (data: {
    sourceTransactionIds: string[];
    requiredAmount: number;
  }): Promise<FundingValidationResponse> => {
    const response = await apiService.post(`${BASE_URL}/funding/validate-sources`, data);
    return response.data;
  },

  // 獲取資金來源相關的分錄記錄
  getFundingSourceEntries: async (sourceId: string, params?: {
    organizationId?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiService.get(`/api/accounting-entries/funding-sources/${sourceId}`, { params });
    return response.data;
  },

  // 獲取資金路徑追蹤的分錄記錄
  getFundingPathEntries: async (transactionId: string) => {
    const response = await apiService.get(`/api/accounting-entries/funding-path/${transactionId}`);
    return response.data;
  }
};

// 資金來源選擇器輔助函數
export const fundingSourceHelpers = {
  // 格式化資金來源顯示文字
  formatFundingSourceDisplay: (source: any): string => {
    const date = new Date(source.transactionDate).toLocaleDateString('zh-TW');
    const amount = source.availableAmount?.toLocaleString('zh-TW') || '0';
    return `${source.groupNumber} - ${source.description} (${date}) - 可用: $${amount}`;
  },

  // 檢查資金來源是否足夠
  checkFundingSufficiency: (sources: any[], requiredAmount: number): boolean => {
    const totalAvailable = sources.reduce((sum, source) => sum + (source.availableAmount || 0), 0);
    return totalAvailable >= requiredAmount;
  },

  // 計算資金來源總可用金額
  calculateTotalAvailable: (sources: any[]): number => {
    return sources.reduce((sum, source) => sum + (source.availableAmount || 0), 0);
  },

  // 過濾可用的資金來源
  filterAvailableSources: (sources: any[], minAmount: number = 0): any[] => {
    return sources.filter(source => 
      source.isAvailable && 
      (source.availableAmount || 0) > minAmount
    );
  },

  // 排序資金來源（按日期和可用金額）
  sortFundingSources: (sources: any[], sortBy: 'date' | 'amount' = 'date'): any[] => {
    return [...sources].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
      } else {
        return (b.availableAmount || 0) - (a.availableAmount || 0);
      }
    });
  }
};

// 資金流向分析輔助函數
export const fundingFlowHelpers = {
  // 建立資金流向樹狀結構
  buildFundingTree: (fundingFlow: any) => {
    const tree = {
      root: fundingFlow.sourceTransaction,
      children: fundingFlow.linkedTransactions || [],
      path: fundingFlow.fundingPath || [],
      totalUsed: fundingFlow.totalUsedAmount || 0,
      available: fundingFlow.availableAmount || 0
    };
    return tree;
  },

  // 計算資金使用率
  calculateUsageRate: (totalAmount: number, usedAmount: number): number => {
    if (totalAmount <= 0) return 0;
    return Math.round((usedAmount / totalAmount) * 100);
  },

  // 格式化資金路徑顯示
  formatFundingPath: (path: any[]): string => {
    return path.map((item, index) => {
      const arrow = index > 0 ? ' → ' : '';
      return `${arrow}${item.groupNumber}`;
    }).join('');
  },

  // 檢查是否為循環引用
  checkCircularReference: (sourceId: string, targetPath: string[]): boolean => {
    return targetPath.includes(sourceId);
  }
};

// 統一匯出
const transactionGroupServiceExports = {
  transactionGroupService,
  fundingTrackingService,
  fundingSourceHelpers,
  fundingFlowHelpers
};

export default transactionGroupServiceExports;