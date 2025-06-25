/**
 * 客戶 API 客戶端
 * 基於通用 BaseApiClient 實現
 */

import { BaseApiClient, HttpClient } from './baseApiClient';
import type { Customer } from '../types/entities';

/**
 * 客戶查詢參數介面
 */
export interface CustomerQueryParams {
  search?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}

/**
 * 客戶 API 客戶端類
 */
export class CustomerApiClient extends BaseApiClient {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/api');
  }

  /**
   * 獲取所有客戶
   */
  async getAllCustomers(params?: CustomerQueryParams): Promise<Customer[]> {
    return this.getList<Customer>('/customers', params);
  }

  /**
   * 根據 ID 獲取客戶
   */
  async getCustomerById(id: string): Promise<Customer> {
    return this.getItem<Customer>('/customers', id);
  }

  /**
   * 創建新客戶
   */
  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    return this.createItem<Customer>('/customers', customerData);
  }

  /**
   * 更新客戶
   */
  async updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
    return this.updateItem<Customer>('/customers', id, customerData);
  }

  /**
   * 刪除客戶
   */
  async deleteCustomer(id: string): Promise<{ success: boolean; message?: string }> {
    return this.deleteItem('/customers', id);
  }

  /**
   * 搜尋客戶
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    return this.getList<Customer>('/customers/search', { q: query });
  }

  /**
   * 獲取活躍客戶
   */
  async getActiveCustomers(): Promise<Customer[]> {
    return this.getList<Customer>('/customers', { active: true });
  }

  /**
   * 獲取客戶購買歷史
   */
  async getCustomerPurchaseHistory(customerId: string): Promise<any[]> {
    return this.getList<any>(`/customers/${customerId}/purchases`);
  }
}

/**
 * 創建客戶 API 客戶端實例
 */
export const createCustomerApiClient = (httpClient: HttpClient): CustomerApiClient => {
  return new CustomerApiClient(httpClient);
};

// 重新匯出基礎類型
export type { HttpClient } from './baseApiClient';