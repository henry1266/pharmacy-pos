import axios from 'axios';
import { format } from 'date-fns'; // Import format for date handling

const API_URL = '/api/accounting';

/**
 * 獲取記帳記錄，可選過濾條件
 * @param {object} filters - 過濾條件對象
 * @param {Date|null} filters.startDate - 開始日期
 * @param {Date|null} filters.endDate - 結束日期
 * @param {string} filters.shift - 班別
 * @returns {Promise<Array>} - 記帳記錄陣列
 * @throws {Error} - 如果請求失敗
 */
export const getAccountingRecords = async (filters = {}) => {
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
    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (err) {
    console.error('獲取記帳記錄失敗 (service):', err);
    throw new Error(err.response?.data?.msg || '獲取記帳記錄失敗');
  }
};

/**
 * 創建新的記帳記錄
 * @param {object} recordData - 記帳記錄數據
 * @returns {Promise<object>} - 已創建的記帳記錄
 * @throws {Error} - 如果請求失敗
 */
export const createAccountingRecord = async (recordData) => {
  try {
    // Ensure date is formatted correctly before sending
    const dataToSend = {
      ...recordData,
      date: format(new Date(recordData.date), 'yyyy-MM-dd')
    };
    const response = await axios.post(API_URL, dataToSend);
    return response.data;
  } catch (err) {
    console.error('創建記帳記錄失敗 (service):', err);
    throw new Error(err.response?.data?.msg || '創建記帳記錄失敗');
  }
};

/**
 * 更新指定的記帳記錄
 * @param {string} id - 記錄 ID
 * @param {object} recordData - 更新的記帳記錄數據
 * @returns {Promise<object>} - 已更新的記帳記錄
 * @throws {Error} - 如果請求失敗
 */
export const updateAccountingRecord = async (id, recordData) => {
  try {
    // Ensure date is formatted correctly before sending
    const dataToSend = {
      ...recordData,
      date: format(new Date(recordData.date), 'yyyy-MM-dd')
    };
    const response = await axios.put(`${API_URL}/${id}`, dataToSend);
    return response.data;
  } catch (err) {
    console.error(`更新記帳記錄 ${id} 失敗 (service):`, err);
    throw new Error(err.response?.data?.msg || '更新記帳記錄失敗');
  }
};

/**
 * 刪除指定的記帳記錄
 * @param {string} id - 記錄 ID
 * @returns {Promise<object>} - 成功響應
 * @throws {Error} - 如果請求失敗
 */
export const deleteAccountingRecord = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data; // Usually an empty object or success message
  } catch (err) {
    console.error(`刪除記帳記錄 ${id} 失敗 (service):`, err);
    throw new Error(err.response?.data?.msg || '刪除記帳記錄失敗');
  }
};

/**
 * 獲取指定日期尚未標記的監控產品銷售記錄
 * @param {string} date - 日期字串 (格式: yyyy-MM-dd)
 * @returns {Promise<Array>} - 未結算銷售記錄陣列
 * @throws {Error} - 如果請求失敗
 */
export const getUnaccountedSales = async (date) => {
  try {
    const response = await axios.get(`${API_URL}/unaccounted-sales`, {
      params: {
        date: date,
      },
    });
    return response.data;
  } catch (err) {
    console.error('獲取未結算銷售記錄失敗 (service):', err);
    throw new Error(err.response?.data?.msg || '獲取未結算銷售記錄失敗');
  }
};

