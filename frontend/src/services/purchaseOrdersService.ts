import axios from 'axios';
import { PurchaseOrder } from '../types/entities';

// Assuming API_BASE_URL is defined elsewhere or use relative paths
// If API_BASE_URL is needed, it should be imported or configured globally
const API_URL = '/api/purchase-orders'; // Adjust if your base URL is different

/**
 * 獲取認證配置
 * @returns {Object} 包含認證頭的配置對象
 */
const getAuthConfig = (): { headers: { 'x-auth-token': string | null } } => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'x-auth-token': token
    }
  };
};

/**
 * 導入採購訂單響應介面
 */
export interface ImportPurchaseOrderResponse {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
  purchaseOrders?: PurchaseOrder[];
  [key: string]: any;
}

/**
 * 根據ID獲取單個採購訂單
 * 用於預覽功能
 * @param {string} id - 採購訂單ID
 * @returns {Promise<PurchaseOrder>} 採購訂單數據
 */
export const getPurchaseOrderById = async (id: string): Promise<PurchaseOrder> => {
  try {
    // Note: The original code had .replace('/api/api', '/api'), ensure the base URL is correct
    const response = await axios.get<PurchaseOrder>(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching purchase order with ID ${id}:`, error);
    // Re-throw the error to be handled by the caller (e.g., the component or hook)
    throw error;
  }
};

/**
 * 從CSV文件導入基本採購訂單數據
 * @param {FormData} formData - 包含CSV文件和類型的表單數據
 * @returns {Promise<ImportPurchaseOrderResponse>} 服務器響應數據
 */
export const importPurchaseOrdersBasic = async (formData: FormData): Promise<ImportPurchaseOrderResponse> => {
  try {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    };
    // Note: The original code had .replace('/api/api', '/api'), ensure the base URL is correct
    const response = await axios.post<ImportPurchaseOrderResponse>(`${API_URL}/import/basic`, formData, config);
    return response.data;
  } catch (error: any) {
    console.error('Error importing basic purchase orders CSV:', error);
    throw error; // Re-throw for handling in the component
  }
};

/**
 * 從CSV文件導入採購訂單項目數據
 * @param {FormData} formData - 包含CSV文件和類型的表單數據
 * @returns {Promise<ImportPurchaseOrderResponse>} 服務器響應數據
 */
export const importPurchaseOrderItems = async (formData: FormData): Promise<ImportPurchaseOrderResponse> => {
  try {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    };
    // Note: The original code had .replace('/api/api', '/api'), ensure the base URL is correct
    const response = await axios.post<ImportPurchaseOrderResponse>(`${API_URL}/import/items`, formData, config);
    return response.data;
  } catch (error: any) {
    console.error('Error importing purchase order items CSV:', error);
    throw error; // Re-throw for handling in the component
  }
};

// Note: Functions like fetchPurchaseOrders, deletePurchaseOrder, searchPurchaseOrders 
// are currently handled via Redux actions in the original code.
// If the goal is to move *all* API calls to services, those actions would need to be refactored
// to call functions defined here, rather than making direct axios calls themselves (if they do).
// For now, this service only includes the API calls made directly from PurchaseOrdersPage.js.

/**
 * 更新現有採購訂單
 * @param {string} id - 要更新的採購訂單ID
 * @param {Partial<PurchaseOrder>} data - 用於更新採購訂單的數據
 * @returns {Promise<PurchaseOrder>} 更新後的採購訂單數據
 */
export const updatePurchaseOrder = async (id: string, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
  try {
    const response = await axios.put<PurchaseOrder>(`${API_URL}/${id}`, data, getAuthConfig());
    return response.data;
  } catch (error: any) {
    console.error(`Error updating purchase order with ID ${id}:`, error);
    throw error;
  }
};

/**
 * 添加新的採購訂單
 * @param {Partial<PurchaseOrder>} data - 新採購訂單的數據
 * @returns {Promise<PurchaseOrder>} 新創建的採購訂單數據
 */
export const addPurchaseOrder = async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
  try {
    const response = await axios.post<PurchaseOrder>(API_URL, data, getAuthConfig());
    return response.data;
  } catch (error: any) {
    console.error('Error adding purchase order:', error);
    throw error;
  }
};

/**
 * 採購訂單服務
 */
const purchaseOrdersService = {
  getPurchaseOrderById,
  importPurchaseOrdersBasic,
  importPurchaseOrderItems,
  updatePurchaseOrder,
  addPurchaseOrder
};

export default purchaseOrdersService;