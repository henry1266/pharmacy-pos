import axios from 'axios';
import { Product } from '../types/entities';

const API_URL = '/api/monitored-products';

/**
 * 監測產品介面
 */
export interface MonitoredProduct {
  _id: string;
  productId: string;
  productCode: string;
  product?: Product;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * 獲取所有監測產品
 * @returns {Promise<MonitoredProduct[]>} 監測產品列表
 */
export const getMonitoredProducts = async (): Promise<MonitoredProduct[]> => {
  try {
    const response = await axios.get<MonitoredProduct[]>(API_URL);
    return response.data;
  } catch (error: any) {
    console.error('獲取監測產品失敗:', error.response?.data?.msg || error.message);
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
    const response = await axios.post<MonitoredProduct>(API_URL, { productCode });
    return response.data;
  } catch (error: any) {
    console.error('新增監測產品失敗:', error.response?.data?.msg || error.message);
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
    const response = await axios.delete<{ success: boolean; message?: string }>(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('刪除監測產品失敗:', error.response?.data?.msg || error.message);
    throw error;
  }
};

/**
 * 監測產品服務
 */
const monitoredProductService = {
  getMonitoredProducts,
  addMonitoredProduct,
  deleteMonitoredProduct
};

export default monitoredProductService;