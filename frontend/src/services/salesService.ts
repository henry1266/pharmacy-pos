import axios from 'axios';
import { Sale } from '@shared/types/entities';

const API_URL = '/api/sales';

/**
 * 獲取最新的銷售單號
 * @param {string} datePrefix - 日期前綴
 * @returns {Promise<string | null>} 最新的銷售單號，如果不存在則返回null
 */
export const getLatestSaleNumber = async (datePrefix: string): Promise<string | null> => {
  try {
    const response = await axios.get<{ latestNumber: string }>(`${API_URL}/latest-number/${datePrefix}`);
    return response.data.latestNumber;
  } catch (error: any) {
    console.error('Error fetching latest sale number:', error);
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * 創建新的銷售記錄
 * @param {Partial<Sale>} saleData - 銷售數據
 * @returns {Promise<Sale>} 創建的銷售記錄
 */
export const createSale = async (saleData: Partial<Sale>): Promise<Sale> => {
  try {
    const response = await axios.post<ApiResponse<Sale>>(API_URL, saleData);
    
    // 檢查 API 回應格式
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('API 回應格式不正確');
    }
  } catch (error: any) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

/**
 * 獲取所有銷售記錄
 * @returns {Promise<Sale[]>} 所有銷售記錄
 */
export const getAllSales = async (): Promise<Sale[]> => {
  try {
    const response = await axios.get<ApiResponse<Sale[]>>(API_URL);
    
    // 檢查 API 回應格式
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('API 回應格式不正確');
    }
  } catch (error: any) {
    console.error('Error fetching all sales:', error);
    throw error;
  }
};

/**
 * API 回應包裝介面
 */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: Date;
}

/**
 * 根據ID獲取銷售記錄
 * @param {string} id - 銷售記錄ID
 * @returns {Promise<Sale>} 銷售記錄
 */
export const getSaleById = async (id: string): Promise<Sale> => {
  try {
    const response = await axios.get<ApiResponse<Sale>>(`${API_URL}/${id}`);
    
    // 檢查 API 回應格式
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('API 回應格式不正確');
    }
  } catch (error: any) {
    console.error(`Error fetching sale with ID ${id}:`, error);
    throw error;
  }
};

/**
 * 更新銷售記錄
 * @param {string} id - 銷售記錄ID
 * @param {Partial<Sale>} saleData - 更新的銷售數據
 * @returns {Promise<Sale>} 更新後的銷售記錄
 */
export const updateSale = async (id: string, saleData: Partial<Sale>): Promise<Sale> => {
  try {
    const response = await axios.put<ApiResponse<Sale>>(`${API_URL}/${id}`, saleData);
    
    // 檢查 API 回應格式
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('API 回應格式不正確');
    }
  } catch (error: any) {
    console.error(`Error updating sale with ID ${id}:`, error);
    throw error;
  }
};

/**
 * 銷售服務
 */
const salesService = {
  getLatestSaleNumber,
  createSale,
  getAllSales,
  getSaleById,
  updateSale
};

export default salesService;