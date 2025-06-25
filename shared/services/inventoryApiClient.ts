/**
 * 庫存 API 客戶端
 * 基於 BaseApiClient 的庫存管理服務
 */

import { BaseApiClient, HttpClient } from './baseApiClient';
import type { Inventory } from '../types/entities';

/**
 * 庫存查詢參數
 */
export interface InventoryQueryParams {
  productId?: string;
  type?: 'purchase' | 'sale' | 'adjustment' | 'return' | 'ship';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * 庫存創建請求
 */
export interface InventoryCreateRequest {
  product: string;
  quantity: number;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  type?: 'purchase' | 'sale' | 'return' | 'adjustment' | 'ship';
  saleId?: string;
  saleNumber?: string;
  shippingOrderId?: string;
  shippingOrderNumber?: string;
  accountingId?: string;
  totalAmount?: number;
  notes?: string;
}

/**
 * 庫存更新請求
 */
export interface InventoryUpdateRequest extends Partial<InventoryCreateRequest> {}

/**
 * 庫存 API 客戶端類
 */
export class InventoryApiClient extends BaseApiClient {
  constructor(httpClient: HttpClient, baseUrl: string = '/api') {
    super(httpClient, `${baseUrl}/inventory`);
  }

  /**
   * 獲取所有庫存記錄
   */
  async getAllInventory(params?: InventoryQueryParams): Promise<Inventory[]> {
    return this.getList<Inventory>('', params);
  }

  /**
   * 根據ID獲取庫存記錄
   */
  async getInventoryById(id: string): Promise<Inventory> {
    return this.getItem<Inventory>('', id);
  }

  /**
   * 根據產品ID獲取庫存記錄
   */
  async getInventoryByProduct(productId: string): Promise<Inventory[]> {
    return this.getList<Inventory>(`/product/${productId}`);
  }

  /**
   * 創建庫存記錄
   */
  async createInventory(data: InventoryCreateRequest): Promise<Inventory> {
    return this.createItem<Inventory>('', data);
  }

  /**
   * 更新庫存記錄
   */
  async updateInventory(id: string, data: InventoryUpdateRequest): Promise<Inventory> {
    return this.updateItem<Inventory>('', id, data);
  }

  /**
   * 刪除庫存記錄
   */
  async deleteInventory(id: string): Promise<{ success: boolean; message?: string }> {
    return this.deleteItem('', id);
  }

  /**
   * 批量創建庫存記錄
   */
  async createBatchInventory(items: InventoryCreateRequest[]): Promise<Inventory[]> {
    return this.post<Inventory[]>('/batch', { items });
  }

  /**
   * 獲取庫存統計
   */
  async getInventoryStats(params?: { 
    startDate?: string; 
    endDate?: string; 
    productId?: string; 
  }): Promise<{
    totalRecords: number;
    totalQuantity: number;
    totalAmount: number;
    byType: Record<string, { count: number; quantity: number; amount: number }>;
  }> {
    return this.get<{
      totalRecords: number;
      totalQuantity: number;
      totalAmount: number;
      byType: Record<string, { count: number; quantity: number; amount: number }>;
    }>('/stats', params);
  }

  /**
   * 獲取庫存變動歷史
   */
  async getInventoryHistory(productId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<Inventory[]> {
    return this.getList<Inventory>(`/history/${productId}`, params);
  }
}

/**
 * 創建庫存 API 客戶端實例的工廠函數
 */
export const createInventoryApiClient = (httpClient: HttpClient, baseUrl?: string): InventoryApiClient => {
  return new InventoryApiClient(httpClient, baseUrl);
};