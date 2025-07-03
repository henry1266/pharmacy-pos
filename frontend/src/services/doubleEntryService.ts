import apiService from '../utils/apiService';

// 複式記帳分錄介面
export interface AccountingEntryDetail {
  _id: string;
  transactionGroupId: string;
  groupNumber: string;
  transactionDate: string;
  groupDescription: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  receiptUrl?: string;
  invoiceNo?: string;
  sequence: number;
  accountId: string;
  accountName: string;
  accountCode: string;
  accountType: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  categoryId?: string;
  categoryName?: string;
  counterpartAccounts: string[]; // 對方科目列表
  createdAt: string;
  updatedAt: string;
}

// 分錄統計資料
export interface EntryStatistics {
  totalDebit: number;
  totalCredit: number;
  balance: number;
  recordCount: number;
}

// 分錄查詢回應
export interface AccountingEntriesResponse {
  success: boolean;
  data: {
    entries: AccountingEntryDetail[];
    statistics: EntryStatistics;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// 分錄查詢參數
export interface EntryQueryParams {
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

const BASE_URL = '/api/accounting2/entries';

// 複式記帳分錄服務
export const doubleEntryService = {
  // 獲取特定科目的分錄記錄
  getByAccount: async (accountId: string, params?: EntryQueryParams): Promise<AccountingEntriesResponse> => {
    const response = await apiService.get(`${BASE_URL}/by-account/${accountId}`, { params });
    return response.data;
  },

  // 獲取特定類別的分錄記錄
  getByCategory: async (categoryId: string, params?: EntryQueryParams): Promise<AccountingEntriesResponse> => {
    const response = await apiService.get(`${BASE_URL}/by-category/${categoryId}`, { params });
    return response.data;
  }
};

export default doubleEntryService;