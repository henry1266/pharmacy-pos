/**
 * Account Service
 * 科目相關的 API 服務
 */

import axios from 'axios';
import { 
  Account, 
  AccountsResponse, 
  CreateAccountRequest, 
  UpdateAccountRequest,
  AccountFilterOptions,
  AccountStatistics
} from '../types';

const API_BASE_URL = '/api/accounting3';

/**
 * 獲取科目列表
 */
export const getAccounts = async (
  filters: AccountFilterOptions = {},
  page: number = 1,
  limit: number = 100
): Promise<AccountsResponse> => {
  const response = await axios.get(`${API_BASE_URL}/accounts`, {
    params: {
      ...filters,
      page,
      limit
    }
  });
  
  return response.data;
};

/**
 * 獲取單個科目
 */
export const getAccount = async (id: string): Promise<Account> => {
  const response = await axios.get(`${API_BASE_URL}/accounts/${id}`);
  return response.data;
};

/**
 * 創建科目
 */
export const createAccount = async (data: CreateAccountRequest): Promise<Account> => {
  const response = await axios.post(`${API_BASE_URL}/accounts`, data);
  return response.data;
};

/**
 * 更新科目
 */
export const updateAccount = async (data: UpdateAccountRequest): Promise<Account> => {
  const response = await axios.put(`${API_BASE_URL}/accounts/${data.id}`, data);
  return response.data;
};

/**
 * 刪除科目
 */
export const deleteAccount = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/accounts/${id}`);
};

/**
 * 獲取科目統計資料
 */
export const getAccountStatistics = async (organizationId: string): Promise<AccountStatistics> => {
  const response = await axios.get(`${API_BASE_URL}/accounts/statistics`, {
    params: { organizationId }
  });
  
  return response.data;
};

/**
 * 獲取科目交易記錄
 */
export const getAccountTransactions = async (
  accountId: string,
  startDate?: string,
  endDate?: string,
  page: number = 1,
  limit: number = 20
) => {
  const response = await axios.get(`${API_BASE_URL}/accounts/${accountId}/transactions`, {
    params: {
      startDate,
      endDate,
      page,
      limit
    }
  });
  
  return response.data;
};