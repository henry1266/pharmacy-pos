/**
 * Transaction Service
 * 交易相關的 API 服務
 */

import axios from 'axios';
import { 
  Transaction, 
  TransactionsResponse, 
  CreateTransactionRequest, 
  UpdateTransactionRequest,
  TransactionFilterOptions,
  TransactionStatistics,
  TransactionGroup,
  FundingFlow
} from '../../features/transactions/types';

const API_BASE_URL = '/api/accounting3';

/**
 * 獲取交易列表
 */
export const getTransactions = async (
  filters: TransactionFilterOptions = {},
  page: number = 1,
  limit: number = 20
): Promise<TransactionsResponse> => {
  const response = await axios.get(`${API_BASE_URL}/transactions`, {
    params: {
      ...filters,
      page,
      limit
    }
  });
  
  return response.data;
};

/**
 * 獲取單個交易
 */
export const getTransaction = async (id: string): Promise<Transaction> => {
  const response = await axios.get(`${API_BASE_URL}/transactions/${id}`);
  return response.data;
};

/**
 * 創建交易
 */
export const createTransaction = async (data: CreateTransactionRequest): Promise<Transaction> => {
  const response = await axios.post(`${API_BASE_URL}/transactions`, data);
  return response.data;
};

/**
 * 更新交易
 */
export const updateTransaction = async (data: UpdateTransactionRequest): Promise<Transaction> => {
  const response = await axios.put(`${API_BASE_URL}/transactions/${data.id}`, data);
  return response.data;
};

/**
 * 刪除交易
 */
export const deleteTransaction = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/transactions/${id}`);
};

/**
 * 獲取交易統計資料
 */
export const getTransactionStatistics = async (
  organizationId: string,
  startDate?: string,
  endDate?: string
): Promise<TransactionStatistics> => {
  const response = await axios.get(`${API_BASE_URL}/transactions/statistics`, {
    params: { 
      organizationId,
      startDate,
      endDate
    }
  });
  
  return response.data;
};

/**
 * 獲取交易群組
 */
export const getTransactionGroups = async (
  organizationId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ groups: TransactionGroup[], total: number }> => {
  const response = await axios.get(`${API_BASE_URL}/transaction-groups`, {
    params: { 
      organizationId,
      page,
      limit
    }
  });
  
  return response.data;
};

/**
 * 創建交易群組
 */
export const createTransactionGroup = async (
  name: string,
  description: string,
  organizationId: string,
  transactionIds: string[]
): Promise<TransactionGroup> => {
  const response = await axios.post(`${API_BASE_URL}/transaction-groups`, {
    name,
    description,
    organizationId,
    transactionIds
  });
  
  return response.data;
};

/**
 * 獲取資金流向
 */
export const getFundingFlows = async (
  transactionId: string
): Promise<FundingFlow[]> => {
  const response = await axios.get(`${API_BASE_URL}/transactions/${transactionId}/funding-flows`);
  return response.data;
};

/**
 * 創建資金流向
 */
export const createFundingFlow = async (
  transactionId: string,
  sourceId: string,
  destinationId: string,
  amount: number,
  description?: string
): Promise<FundingFlow> => {
  const response = await axios.post(`${API_BASE_URL}/funding-flows`, {
    transactionId,
    sourceId,
    destinationId,
    amount,
    date: new Date().toISOString(),
    description
  });
  
  return response.data;
};

/**
 * 上傳交易附件
 */
export const uploadTransactionAttachment = async (
  transactionId: string,
  file: File
): Promise<{ id: string, url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    `${API_BASE_URL}/transactions/${transactionId}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data;
};

/**
 * 刪除交易附件
 */
export const deleteTransactionAttachment = async (
  transactionId: string,
  attachmentId: string
): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/transactions/${transactionId}/attachments/${attachmentId}`);
};