import axios from 'axios';
import { format } from 'date-fns';
import { AccountingRecord } from '@pharmacy-pos/shared/types/entities';
import type {
  AccountingFilters,
  ExtendedAccountingRecord,
  UnaccountedSale
} from '../types/accounting';

const API_URL = '/api/accounting';

/**
 * 獲取記帳記錄，可選過濾條件
 * @param {AccountingFilters} filters - 過濾條件對象
 * @returns {Promise<AccountingRecord[]>} - 記帳記錄陣列
 * @throws {Error} - 如果請求失敗
 */
export const getAccountingRecords = async (filters: AccountingFilters = {}): Promise<ExtendedAccountingRecord[]> => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) {
      params.append('startDate', format(filters.startDate, 'yyyy-MM-dd'));
    }
    if (filters.endDate) {
      params.append('endDate', format(filters.endDate, 'yyyy-MM-dd'));
    }
    if (filters.shift) {
      params.append('shift', filters.shift);
    }
    const response = await axios.get<ExtendedAccountingRecord[]>(API_URL, { params });
    return response.data;
  } catch (err: any) {
    console.error('獲取記帳記錄失敗 (service):', err);
    throw new Error(err.response?.data?.msg ?? '獲取記帳記錄失敗');
  }
};

/**
 * 創建新的記帳記錄
 * @param {Partial<AccountingRecord>} recordData - 記帳記錄數據
 * @returns {Promise<AccountingRecord>} - 已創建的記帳記錄
 * @throws {Error} - 如果請求失敗
 */
export const createAccountingRecord = async (recordData: Partial<AccountingRecord>): Promise<AccountingRecord> => {
  try {
    // Ensure date is formatted correctly before sending
    const dataToSend = {
      ...recordData,
      date: format(new Date(recordData.date), 'yyyy-MM-dd')
    };
    const response = await axios.post<AccountingRecord>(API_URL, dataToSend);
    return response.data;
  } catch (err: any) {
    console.error('創建記帳記錄失敗 (service):', err);
    throw new Error(err.response?.data?.msg ?? '創建記帳記錄失敗');
  }
};

/**
 * 更新指定的記帳記錄
 * @param {string} id - 記錄 ID
 * @param {Partial<AccountingRecord>} recordData - 更新的記帳記錄數據
 * @returns {Promise<AccountingRecord>} - 已更新的記帳記錄
 * @throws {Error} - 如果請求失敗
 */
export const updateAccountingRecord = async (id: string, recordData: Partial<AccountingRecord>): Promise<AccountingRecord> => {
  try {
    // Ensure date is formatted correctly before sending
    const dataToSend = {
      ...recordData,
      date: format(new Date(recordData.date), 'yyyy-MM-dd')
    };
    const response = await axios.put<AccountingRecord>(`${API_URL}/${id}`, dataToSend);
    return response.data;
  } catch (err: any) {
    console.error(`更新記帳記錄 ${id} 失敗 (service):`, err);
    throw new Error(err.response?.data?.msg ?? '更新記帳記錄失敗');
  }
};

/**
 * 刪除指定的記帳記錄
 * @param {string} id - 記錄 ID
 * @returns {Promise<{ success: boolean; message?: string }>} - 成功響應
 * @throws {Error} - 如果請求失敗
 */
export const deleteAccountingRecord = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await axios.delete<{ success: boolean; message?: string }>(`${API_URL}/${id}`);
    return response.data; // Usually an empty object or success message
  } catch (err: any) {
    console.error(`刪除記帳記錄 ${id} 失敗 (service):`, err);
    throw new Error(err.response?.data?.msg ?? '刪除記帳記錄失敗');
  }
};


/**
 * 獲取指定日期尚未標記的監控產品銷售記錄
 * @param {string} date - 日期字串 (格式: yyyy-MM-dd)
 * @returns {Promise<UnaccountedSale[]>} - 未結算銷售記錄陣列
 * @throws {Error} - 如果請求失敗
 */
export const getUnaccountedSales = async (date: string): Promise<UnaccountedSale[]> => {
  try {
    const response = await axios.get<UnaccountedSale[]>(`${API_URL}/unaccounted-sales`, {
      params: {
        date: date,
      },
    });
    return response.data;
  } catch (err: any) {
    console.error('獲取未結算銷售記錄失敗 (service):', err);
    throw new Error(err.response?.data?.msg ?? '獲取未結算銷售記錄失敗');
  }
};

/**
 * 記帳服務
 */
const accountingService = {
  getAccountingRecords,
  createAccountingRecord,
  updateAccountingRecord,
  deleteAccountingRecord,
  getUnaccountedSales
};

export default accountingService;