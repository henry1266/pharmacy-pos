import apiService from '../utils/apiService';
import {
  TransactionGroupWithEntriesFormData,
  TransactionGroupWithEntriesListResponse,
  TransactionGroupWithEntriesDetailResponse,
  TransactionGroupWithEntries,
  FundingSourcesResponse,
  FundingFlowResponse,
  FundingValidationResponse,
  EmbeddedEntriesValidationResponse,
  TransactionGroupFilter
} from '@pharmacy-pos/shared';

const BASE_URL = '/api/transaction-groups-with-entries';

// 內嵌分錄交易群組基本 CRUD 操作
export const transactionGroupWithEntriesService = {
  // 獲取所有交易群組（包含內嵌分錄）
  getAll: async (params?: TransactionGroupFilter): Promise<TransactionGroupWithEntriesListResponse> => {
    const response = await apiService.get(BASE_URL, { params });
    return response.data;
  },

  // 獲取單一交易群組詳情（包含內嵌分錄）
  getById: async (id: string): Promise<TransactionGroupWithEntriesDetailResponse> => {
    const response = await apiService.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // 建立交易群組（包含內嵌分錄）
  create: async (data: TransactionGroupWithEntriesFormData): Promise<TransactionGroupWithEntriesDetailResponse> => {
    const response = await apiService.post(BASE_URL, data);
    return response.data;
  },

  // 更新交易群組（包含內嵌分錄）
  update: async (id: string, data: Partial<TransactionGroupWithEntriesFormData>): Promise<TransactionGroupWithEntriesDetailResponse> => {
    const response = await apiService.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  // 刪除交易群組
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  // 確認交易
  confirm: async (id: string): Promise<TransactionGroupWithEntriesDetailResponse> => {
    const response = await apiService.post(`${BASE_URL}/${id}/confirm`);
    return response.data;
  },

  // 驗證內嵌分錄借貸平衡
  validateEntries: async (entries: any[]): Promise<EmbeddedEntriesValidationResponse> => {
    const response = await apiService.post(`${BASE_URL}/validate-entries`, { entries });
    return response.data;
  }
};

// 資金來源追蹤相關服務（適配內嵌分錄結構）
export const embeddedFundingTrackingService = {
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
  }
};

// 內嵌分錄輔助函數
export const embeddedEntriesHelpers = {
  // 計算借貸平衡
  calculateBalance: (entries: any[]): { 
    totalDebit: number; 
    totalCredit: number; 
    isBalanced: boolean; 
    difference: number 
  } => {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01; // 允許小數點誤差

    return {
      totalDebit,
      totalCredit,
      isBalanced,
      difference
    };
  },

  // 驗證分錄完整性
  validateEntries: (entries: any[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!entries || entries.length === 0) {
      errors.push('至少需要一筆分錄');
      return { isValid: false, errors };
    }

    if (entries.length < 2) {
      errors.push('複式記帳至少需要兩筆分錄');
    }

    // 檢查每筆分錄
    entries.forEach((entry, index) => {
      if (!entry.accountId) {
        errors.push(`第 ${index + 1} 筆分錄缺少會計科目`);
      }
      if (!entry.description || entry.description.trim() === '') {
        errors.push(`第 ${index + 1} 筆分錄缺少描述`);
      }
      if ((entry.debitAmount || 0) === 0 && (entry.creditAmount || 0) === 0) {
        errors.push(`第 ${index + 1} 筆分錄借方和貸方金額不能都為零`);
      }
      if ((entry.debitAmount || 0) > 0 && (entry.creditAmount || 0) > 0) {
        errors.push(`第 ${index + 1} 筆分錄不能同時有借方和貸方金額`);
      }
      if ((entry.debitAmount || 0) < 0 || (entry.creditAmount || 0) < 0) {
        errors.push(`第 ${index + 1} 筆分錄金額不能為負數`);
      }
    });

    // 檢查借貸平衡
    const balance = embeddedEntriesHelpers.calculateBalance(entries);
    if (!balance.isBalanced) {
      errors.push(`借貸不平衡，差額：${balance.difference.toFixed(2)}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // 自動分配序號
  assignSequenceNumbers: (entries: any[]): any[] => {
    return entries.map((entry, index) => ({
      ...entry,
      sequence: index + 1
    }));
  },

  // 格式化分錄顯示
  formatEntryDisplay: (entry: any): string => {
    const amount = entry.debitAmount > 0 ? 
      `借：$${entry.debitAmount.toLocaleString('zh-TW')}` : 
      `貸：$${entry.creditAmount.toLocaleString('zh-TW')}`;
    return `${entry.accountName || entry.accountId} - ${entry.description} (${amount})`;
  },

  // 計算交易總金額
  calculateTotalAmount: (entries: any[]): number => {
    const balance = embeddedEntriesHelpers.calculateBalance(entries);
    return Math.max(balance.totalDebit, balance.totalCredit);
  },

  // 檢查是否有重複序號
  checkDuplicateSequences: (entries: any[]): boolean => {
    const sequences = entries.map(entry => entry.sequence).filter(seq => seq !== undefined);
    return sequences.length !== new Set(sequences).size;
  },

  // 排序分錄（按序號）
  sortEntriesBySequence: (entries: any[]): any[] => {
    return [...entries].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }
};

// 資金來源選擇器輔助函數（適配內嵌分錄）
export const embeddedFundingSourceHelpers = {
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

// 資金流向分析輔助函數（適配內嵌分錄）
export const embeddedFundingFlowHelpers = {
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
export default {
  transactionGroupWithEntriesService,
  embeddedFundingTrackingService,
  embeddedEntriesHelpers,
  embeddedFundingSourceHelpers,
  embeddedFundingFlowHelpers
};