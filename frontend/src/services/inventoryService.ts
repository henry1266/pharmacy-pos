import axios from 'axios';
import { Inventory } from '../types/entities';

const API_URL = '/api/inventory';

/**
 * 獲取特定產品的庫存記錄
 * @param {string} productId - 產品ID
 * @returns {Promise<Inventory[]>} 包含庫存記錄的Promise
 * @throws {Error} 如果請求失敗
 */
export const getInventoryByProduct = async (productId: string): Promise<Inventory[]> => {
  try {
    const response = await axios.get<Inventory[]>(`${API_URL}/product/${productId}`);
    return response.data;
  } catch (err: any) {
    console.error(`獲取產品 ${productId} 的庫存記錄失敗 (service):`, err);
    throw new Error(err.response?.data?.msg ?? `獲取產品 ${productId} 的庫存記錄失敗`);
  }
};

/**
 * 庫存服務
 */
const inventoryService = {
  getInventoryByProduct,
};

export default inventoryService;