/**
 * 庫存服務 V2
 * 基於統一 API 客戶端架構的庫存管理服務
 */

import axios from 'axios';
import { 
  createInventoryApiClient, 
  type InventoryQueryParams,
  type InventoryCreateRequest,
  type InventoryUpdateRequest
} from '@pharmacy-pos/shared/services/inventoryApiClient';
import type { HttpClient } from '@pharmacy-pos/shared/services/baseApiClient';
import type { Inventory } from '@pharmacy-pos/shared/types/entities';

// 創建 axios 適配器
const axiosAdapter: HttpClient = {
  get: axios.get.bind(axios),
  post: axios.post.bind(axios),
  put: axios.put.bind(axios),
  delete: axios.delete.bind(axios),
};

// 創建庫存 API 客戶端實例
const apiClient = createInventoryApiClient(axiosAdapter);

// 直接匯出方法，實現零重複代碼
export const getAllInventory = apiClient.getAllInventory.bind(apiClient);
export const getInventoryById = apiClient.getInventoryById.bind(apiClient);
export const getInventoryByProduct = apiClient.getInventoryByProduct.bind(apiClient);
export const createInventory = apiClient.createInventory.bind(apiClient);
export const updateInventory = apiClient.updateInventory.bind(apiClient);
export const deleteInventory = apiClient.deleteInventory.bind(apiClient);
export const createBatchInventory = apiClient.createBatchInventory.bind(apiClient);
export const getInventoryStats = apiClient.getInventoryStats.bind(apiClient);
export const getInventoryHistory = apiClient.getInventoryHistory.bind(apiClient);

// 匯出類型定義
export type {
  InventoryQueryParams,
  InventoryCreateRequest,
  InventoryUpdateRequest,
  Inventory
};

// 預設匯出（向後相容）
const inventoryServiceV2 = {
  getAllInventory,
  getInventoryById,
  getInventoryByProduct,
  createInventory,
  updateInventory,
  deleteInventory,
  createBatchInventory,
  getInventoryStats,
  getInventoryHistory,
};

export default inventoryServiceV2;