import axios from 'axios';
import { API_BASE_URL } from '../redux/actions'; // Assuming API_BASE_URL is exported
import { ShippingOrder } from '@shared/types/entities';

const SERVICE_URL = `${API_BASE_URL}/shipping-orders`.replace('/api/api', '/api');

/**
 * 導入出貨訂單響應介面
 */
export interface ImportShippingOrderResponse {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
  shippingOrders?: ShippingOrder[];
  [key: string]: any;
}

/**
 * 根據ID獲取單個出貨訂單
 * 用於預覽功能
 * @param {string} id - 出貨訂單ID
 * @returns {Promise<ShippingOrder>} 出貨訂單數據
 */
export const getShippingOrderById = async (id: string): Promise<ShippingOrder> => {
  try {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    const response = await axios.get<ShippingOrder>(`${SERVICE_URL}/${id}`, config);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching shipping order with ID ${id}:`, error);
    throw error; // Re-throw to be handled by the caller (e.g., the hook)
  }
};

/**
 * 從CSV文件導入出貨訂單基本信息
 * @param {File} file - CSV文件
 * @returns {Promise<ImportShippingOrderResponse>} 服務器響應
 */
export const importShippingOrdersBasic = async (file: File): Promise<ImportShippingOrderResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'basic'); // Explicitly set type

    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    };

    const response = await axios.post<ImportShippingOrderResponse>(`${SERVICE_URL}/import/basic`, formData, config);
    return response.data;
  } catch (error: any) {
    console.error('Error importing basic shipping orders CSV:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * 從CSV文件導入出貨訂單項目
 * @param {File} file - CSV文件
 * @returns {Promise<ImportShippingOrderResponse>} 服務器響應
 */
export const importShippingOrdersItems = async (file: File): Promise<ImportShippingOrderResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'items'); // Explicitly set type

    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    };

    const response = await axios.post<ImportShippingOrderResponse>(`${SERVICE_URL}/import/items`, formData, config);
    return response.data;
  } catch (error: any) {
    console.error('Error importing shipping order items CSV:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * 出貨訂單服務
 */
const shippingOrdersService = {
  getShippingOrderById,
  importShippingOrdersBasic,
  importShippingOrdersItems
};

export default shippingOrdersService;

// Note: Functions like fetchShippingOrders, deleteShippingOrder, searchShippingOrders 
// are currently handled via Redux actions (actions.js). 
// For consistency, they could also be moved here and Redux actions could call these service functions.
// However, based on the current task scope, we only move the direct axios calls found in the component/hook.