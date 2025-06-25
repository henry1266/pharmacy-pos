import axios from 'axios';
import type { AccountingCategory } from '@pharmacy-pos/shared/types/accounting';
import { ApiResponse } from '@pharmacy-pos/shared/types/api';

/**
 * 獲取所有記帳名目類別
 * @returns {Promise<AccountingCategory[]>} 包含所有記帳名目類別的Promise
 */
export const getAccountingCategories = async (): Promise<AccountingCategory[]> => {
  try {
    const res = await axios.get<ApiResponse<AccountingCategory[]>>('/api/accounting-categories');
    // 後端回傳的是 ApiResponse 格式，實際資料在 data 欄位中
    return res.data.data || [];
  } catch (err: any) {
    console.error('獲取記帳名目類別失敗:', err.response?.data?.message ?? err.message);
    throw err;
  }
};

/**
 * 新增記帳名目類別
 * @param {Partial<AccountingCategory>} categoryData - 新記帳名目類別的數據
 * @returns {Promise<AccountingCategory>} 包含新創建的記帳名目類別的Promise
 */
export const addAccountingCategory = async (categoryData: Partial<AccountingCategory>): Promise<AccountingCategory> => {
  try {
    const res = await axios.post<ApiResponse<AccountingCategory>>('/api/accounting-categories', categoryData);
    // 後端回傳的是 ApiResponse 格式，實際資料在 data 欄位中
    return res.data.data;
  } catch (err: any) {
    console.error('新增記帳名目類別失敗:', err.response?.data?.message ?? err.message);
    throw err;
  }
};

/**
 * 更新記帳名目類別
 * @param {string} id - 要更新的記帳名目類別ID
 * @param {Partial<AccountingCategory>} categoryData - 記帳名目類別的更新數據
 * @returns {Promise<AccountingCategory>} 包含更新後的記帳名目類別的Promise
 */
export const updateAccountingCategory = async (id: string, categoryData: Partial<AccountingCategory>): Promise<AccountingCategory> => {
  try {
    const res = await axios.put<ApiResponse<AccountingCategory>>(`/api/accounting-categories/${id}`, categoryData);
    // 後端回傳的是 ApiResponse 格式，實際資料在 data 欄位中
    return res.data.data;
  } catch (err: any) {
    console.error('更新記帳名目類別失敗:', err.response?.data?.message ?? err.message);
    throw err;
  }
};

/**
 * 刪除記帳名目類別
 * @param {string} id - 要刪除的記帳名目類別ID
 * @returns {Promise<{ success: boolean; message?: string }>} 包含刪除結果的Promise
 */
export const deleteAccountingCategory = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await axios.delete<ApiResponse<null>>(`/api/accounting-categories/${id}`);
    // 後端回傳的是 ApiResponse 格式
    return { success: res.data.success, message: res.data.message };
  } catch (err: any) {
    console.error('刪除記帳名目類別失敗:', err.response?.data?.message ?? err.message);
    throw err;
  }
};

/**
 * 記帳名目類別服務
 */
const accountingCategoryService = {
  getAccountingCategories,
  addAccountingCategory,
  updateAccountingCategory,
  deleteAccountingCategory
};

export default accountingCategoryService;