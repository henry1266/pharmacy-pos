/**
 * 供應商 API 客戶端
 * 基於通用 BaseApiClient 實現
 */

import { BaseApiClient, HttpClient } from './baseApiClient';
import type { Supplier } from '../types/entities';

/**
 * 供應商查詢參數介面
 */
export interface SupplierQueryParams {
  search?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

/**
 * 供應商 API 客戶端類
 */
export class SupplierApiClient extends BaseApiClient {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/api');
  }

  /**
   * 獲取所有供應商
   */
  async getAllSuppliers(params?: SupplierQueryParams): Promise<Supplier[]> {
    return this.getList<Supplier>('/suppliers', params);
  }

  /**
   * 根據 ID 獲取供應商
   */
  async getSupplierById(id: string): Promise<Supplier> {
    return this.getItem<Supplier>('/suppliers', id);
  }

  /**
   * 創建新供應商
   */
  async createSupplier(supplierData: Partial<Supplier>): Promise<Supplier> {
    return this.createItem<Supplier>('/suppliers', supplierData);
  }

  /**
   * 更新供應商
   */
  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier> {
    return this.updateItem<Supplier>('/suppliers', id, supplierData);
  }

  /**
   * 刪除供應商
   */
  async deleteSupplier(id: string): Promise<{ success: boolean; message?: string }> {
    return this.deleteItem('/suppliers', id);
  }

  /**
   * 搜尋供應商
   */
  async searchSuppliers(query: string): Promise<Supplier[]> {
    return this.getList<Supplier>('/suppliers/search', { q: query });
  }

  /**
   * 獲取活躍供應商
   */
  async getActiveSuppliers(): Promise<Supplier[]> {
    return this.getList<Supplier>('/suppliers', { active: true });
  }
}

/**
 * 創建供應商 API 客戶端實例
 */
export const createSupplierApiClient = (httpClient: HttpClient): SupplierApiClient => {
  return new SupplierApiClient(httpClient);
};

// 重新匯出基礎類型
export type { HttpClient } from './baseApiClient';