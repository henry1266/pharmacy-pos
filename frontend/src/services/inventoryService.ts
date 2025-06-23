import axios from 'axios';
import { ApiResponse } from '@pharmacy-pos/shared/types/api';
import { Inventory } from '@pharmacy-pos/shared/types/entities';

const API_URL = '/api/inventory';


/**
 * 獲取特定產品的庫存記錄
 * @param {string} productId - 產品ID
 * @returns {Promise<Inventory[]>} 包含庫存記錄的Promise
 * @throws {Error} 如果請求失敗
 */
export const getInventoryByProduct = async (productId: string): Promise<Inventory[]> => {
  try {
    const response = await axios.get<ApiResponse<Inventory[]>>(`${API_URL}/product/${productId}`);
    
    // 檢查回應格式並提取資料
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      // 後端返回 ApiResponse 格式
      const apiResponse = response.data as ApiResponse<Inventory[]>;
      if (!apiResponse.success) {
        throw new Error(apiResponse.message ?? '獲取庫存記錄失敗');
      }
      return apiResponse.data ?? [];
    } else if (Array.isArray(response.data)) {
      // 後端直接返回陣列（向後相容）
      return response.data;
    } else {
      // 未知格式，嘗試提取 data 屬性
      return (response.data as { data?: Inventory[] })?.data ?? [];
    }
  } catch (err: any) {
    console.error(`獲取產品 ${productId} 的庫存記錄失敗 (service):`, err);
    const errorMessage = err.response?.data?.message ?? err.response?.data?.msg ?? err.message ?? `獲取產品 ${productId} 的庫存記錄失敗`;
    throw new Error(errorMessage);
  }
};

/**
 * 庫存服務
 */
const inventoryService = {
  getInventoryByProduct,
};

export default inventoryService;