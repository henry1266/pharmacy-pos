/**
 * 供應商 API 客戶端
 * 依賴 BaseApiClient 封裝 CRUD 操作
 */

import { BaseApiClient, HttpClient } from './baseApiClient';
import type { Supplier } from '../types/entities';

/**
 * 供應商查詢參數
 */
export interface SupplierQueryParams {
  search?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

/**
 * 供應商 API 客戶端實作
 */
export class SupplierApiClient extends BaseApiClient {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/api');
  }

  /**
   * 取得所有供應商
   */
  async getAllSuppliers(params?: SupplierQueryParams): Promise<Supplier[]> {
    return this.getList<Supplier>('/suppliers', params);
  }

  /**
   * 依 ID 取得供應商
   */
  async getSupplierById(id: string): Promise<Supplier> {
    return this.getItem<Supplier>('/suppliers', id);
  }

  /**
   * 建立供應商
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
   * 模糊搜尋供應商
   */
  async searchSuppliers(query: string): Promise<Supplier[]> {
    return this.getList<Supplier>('/suppliers/search', { q: query });
  }

  /**
   * 取得啟用中的供應商
   */
  async getActiveSuppliers(): Promise<Supplier[]> {
    return this.getList<Supplier>('/suppliers', { active: true });
  }
}

/**
 * 工廠函式
 */
export const createSupplierApiClient = (httpClient: HttpClient): SupplierApiClient => {
  return new SupplierApiClient(httpClient);
};

// re-export shared helpers
export type { HttpClient } from './baseApiClient';

export { createSuppliersContractClient } from '../api/clients/suppliers';
export type { SuppliersContractClient, SuppliersClientOptions } from '../api/clients/suppliers';
