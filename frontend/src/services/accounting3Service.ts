import apiService from '../utils/apiService';
import {
  Account2,
  Category2,
  AccountingRecord2,
  Account2FormData,
  Category2FormData,
  AccountingRecord2FormData,
  Account2ListResponse,
  Account2DetailResponse,
  Category2ListResponse,
  Category2DetailResponse,
  AccountingRecord2ListResponse,
  AccountingRecord2DetailResponse,
  AccountingRecord2SummaryResponse,
  AccountingRecord2Filter,
  AccountBalance,
  CategoryReorderItem,
  ApiResponse
} from '@pharmacy-pos/shared/types/accounting2';

// accounting3 使用簡化的 API 路徑
const BASE_URL = '/api';

// 帳戶管理 API - 使用 accounting3 簡化路徑
export const accountsApi = {
  // 獲取所有帳戶
  getAll: async (organizationId?: string | null): Promise<Account2ListResponse> => {
    const params = organizationId ? { organizationId } : {};
    const response = await apiService.get(`${BASE_URL}/accounts`, { params });
    return response.data;
  },

  // 獲取單一帳戶
  getById: async (id: string): Promise<Account2DetailResponse> => {
    const response = await apiService.get(`${BASE_URL}/accounts/${id}`);
    return response.data;
  },

  // 新增帳戶
  create: async (data: Account2FormData): Promise<Account2DetailResponse> => {
    const response = await apiService.post(`${BASE_URL}/accounts`, data);
    return response.data;
  },

  // 更新帳戶
  update: async (id: string, data: Partial<Account2FormData>): Promise<Account2DetailResponse> => {
    const response = await apiService.put(`${BASE_URL}/accounts/${id}`, data);
    return response.data;
  },

  // 刪除帳戶
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiService.delete(`${BASE_URL}/accounts/${id}`);
    return response.data;
  },

  // 獲取帳戶餘額
  getBalance: async (id: string): Promise<{ success: boolean; data: AccountBalance }> => {
    const response = await apiService.get(`${BASE_URL}/accounts/${id}/balance`);
    return response.data;
  },

  // 調整帳戶餘額
  updateBalance: async (id: string, balance: number): Promise<{ success: boolean; data: AccountBalance; message: string }> => {
    const response = await apiService.put(`${BASE_URL}/accounts/${id}/balance`, { balance });
    return response.data;
  }
};

// 類別管理 API - 使用 accounting3 簡化路徑
export const categoriesApi = {
  // 獲取所有類別
  getAll: async (params?: { type?: 'income' | 'expense'; organizationId?: string }): Promise<Category2ListResponse> => {
    const response = await apiService.get(`${BASE_URL}/categories`, { params });
    return response.data;
  },

  // 獲取收入類別
  getIncome: async (): Promise<Category2ListResponse> => {
    const response = await apiService.get(`${BASE_URL}/categories/income`);
    return response.data;
  },

  // 獲取支出類別
  getExpense: async (): Promise<Category2ListResponse> => {
    const response = await apiService.get(`${BASE_URL}/categories/expense`);
    return response.data;
  },

  // 獲取單一類別
  getById: async (id: string): Promise<Category2DetailResponse> => {
    const response = await apiService.get(`${BASE_URL}/categories/${id}`);
    return response.data;
  },

  // 新增類別
  create: async (data: Category2FormData): Promise<Category2DetailResponse> => {
    const response = await apiService.post(`${BASE_URL}/categories`, data);
    return response.data;
  },

  // 更新類別
  update: async (id: string, data: Partial<Category2FormData>): Promise<Category2DetailResponse> => {
    const response = await apiService.put(`${BASE_URL}/categories/${id}`, data);
    return response.data;
  },

  // 刪除類別
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiService.delete(`${BASE_URL}/categories/${id}`);
    return response.data;
  },

  // 重新排序類別
  reorder: async (categories: CategoryReorderItem[]): Promise<ApiResponse> => {
    const response = await apiService.put(`${BASE_URL}/categories/reorder`, { categories });
    return response.data;
  }
};

// 記帳記錄 API - 使用 accounting3 簡化路徑
export const recordsApi = {
  // 獲取記帳記錄列表
  getAll: async (filter?: AccountingRecord2Filter): Promise<AccountingRecord2ListResponse> => {
    const response = await apiService.get(`${BASE_URL}/records`, { params: filter });
    return response.data;
  },

  // 獲取記帳摘要
  getSummary: async (startDate?: string, endDate?: string): Promise<AccountingRecord2SummaryResponse> => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiService.get(`${BASE_URL}/records/summary`, { params });
    return response.data;
  },

  // 獲取單一記帳記錄
  getById: async (id: string): Promise<AccountingRecord2DetailResponse> => {
    const response = await apiService.get(`${BASE_URL}/records/${id}`);
    return response.data;
  },

  // 新增記帳記錄
  create: async (data: AccountingRecord2FormData): Promise<AccountingRecord2DetailResponse> => {
    const response = await apiService.post(`${BASE_URL}/records`, data);
    return response.data;
  },

  // 更新記帳記錄
  update: async (id: string, data: Partial<AccountingRecord2FormData>): Promise<AccountingRecord2DetailResponse> => {
    const response = await apiService.put(`${BASE_URL}/records/${id}`, data);
    return response.data;
  },

  // 刪除記帳記錄
  delete: async (id: string): Promise<ApiResponse> => {
    const response = await apiService.delete(`${BASE_URL}/records/${id}`);
    return response.data;
  }
};

// 統一的 accounting3 服務 - 使用簡化路徑
const accounting3ServiceExports = {
  accounts: accountsApi,
  categories: categoriesApi,
  records: recordsApi
};

export const accounting3Service = accounting3ServiceExports;

export default accounting3ServiceExports;