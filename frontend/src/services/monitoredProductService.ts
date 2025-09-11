import axios from 'axios';
import { ApiResponse } from '@pharmacy-pos/shared/types/api';

const API_URL = '/api/monitored-products';

// 確保 axios 請求帶有身份驗證標頭
const ensureAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

/**
 * 監測產品介面 - 與後端回傳格式一致
 */
export interface MonitoredProduct {
  _id: string;
  productCode: string;
  productName: string;
  addedBy: string;
  order?: number;
}

/**
 * 更新監測產品請求介面
 */
export interface UpdateMonitoredProductRequest {
  productCode?: string;
  order?: number;
}

/**
 * 獲取所有監測產品
 * @returns {Promise<MonitoredProduct[]>} 監測產品列表
 */
export const getMonitoredProducts = async (): Promise<MonitoredProduct[]> => {
  try {
    // 確保請求帶有身份驗證標頭
    ensureAuthHeaders();
    
    const response = await axios.get<ApiResponse<MonitoredProduct[]>>(API_URL);
    // 後端回傳的是 ApiResponse 格式，實際資料在 data 欄位中
    return response.data.data || [];
  } catch (error: any) {
    console.error('獲取監測產品失敗:', error.response?.data?.message ?? error.message);
    throw error;
  }
};

/**
 * 新增監測產品
 * @param {string} productCode - 產品代碼
 * @returns {Promise<MonitoredProduct>} 新增的監測產品
 */
export const addMonitoredProduct = async (productCode: string): Promise<MonitoredProduct> => {
  try {
    // 確保請求帶有身份驗證標頭
    ensureAuthHeaders();
    
    const response = await axios.post<ApiResponse<MonitoredProduct>>(API_URL, { productCode });
    // 後端回傳的是 ApiResponse 格式，實際資料在 data 欄位中
    if (!response.data.data) {
      throw new Error('新增監測產品失敗：回傳資料為空');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('新增監測產品失敗:', error.response?.data?.message ?? error.message);
    throw error;
  }
};

/**
 * 刪除監測產品
 * @param {string} id - 監測產品ID
 * @returns {Promise<{ success: boolean; message?: string }>} 刪除結果
 */
export const deleteMonitoredProduct = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // 確保請求帶有身份驗證標頭
    ensureAuthHeaders();
    
    const response = await axios.delete<ApiResponse<null>>(`${API_URL}/${id}`);
    // 後端回傳的是 ApiResponse 格式
    const result: { success: boolean; message?: string } = { success: response.data.success };
    if (response.data.message) {
      result.message = response.data.message;
    }
    return result;
  } catch (error: any) {
    console.error('刪除監測產品失敗:', error.response?.data?.message ?? error.message);
    throw error;
  }
};

/**
 * 更新監測產品
 * @param {string} id - 監測產品ID
 * @param {UpdateMonitoredProductRequest} data - 更新資料
 * @returns {Promise<MonitoredProduct>} 更新後的監測產品
 */
export const updateMonitoredProduct = async (id: string, data: UpdateMonitoredProductRequest): Promise<MonitoredProduct> => {
  try {
    // 確保請求帶有身份驗證標頭
    ensureAuthHeaders();
    
    const response = await axios.put<ApiResponse<MonitoredProduct>>(`${API_URL}/${id}`, data);
    if (!response.data.data) {
      throw new Error('更新監測產品失敗：回傳資料為空');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('更新監測產品失敗:', error.response?.data?.message ?? error.message);
    throw error;
  }
};

/**
 * 監測產品服務
 */
const monitoredProductService = {
  getMonitoredProducts,
  addMonitoredProduct,
  deleteMonitoredProduct,
  updateMonitoredProduct
};

export default monitoredProductService;