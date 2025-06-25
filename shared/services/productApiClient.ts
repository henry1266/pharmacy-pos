/**
 * 產品 API 客戶端
 * 基於通用 BaseApiClient 實現
 */

import { BaseApiClient, HttpClient } from './baseApiClient';
import type { Product } from '../types/entities';

/**
 * 產品查詢參數介面
 */
export interface ProductQueryParams {
  search?: string;
  category?: string;
  supplier?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}

/**
 * 產品 API 客戶端類
 */
export class ProductApiClient extends BaseApiClient {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/api');
  }

  /**
   * 獲取所有產品
   */
  async getAllProducts(params?: ProductQueryParams): Promise<Product[]> {
    return this.getList<Product>('/products', params);
  }

  /**
   * 根據 ID 獲取產品
   */
  async getProductById(id: string): Promise<Product> {
    return this.getItem<Product>('/products', id);
  }

  /**
   * 創建新產品
   */
  async createProduct(productData: Partial<Product>): Promise<Product> {
    return this.createItem<Product>('/products', productData);
  }

  /**
   * 更新產品
   */
  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    return this.updateItem<Product>('/products', id, productData);
  }

  /**
   * 刪除產品
   */
  async deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
    return this.deleteItem('/products', id);
  }

  /**
   * 搜尋產品
   */
  async searchProducts(query: string): Promise<Product[]> {
    return this.getList<Product>('/products/search', { q: query });
  }

  /**
   * 獲取低庫存產品
   */
  async getLowStockProducts(): Promise<Product[]> {
    return this.getList<Product>('/products/low-stock');
  }

  /**
   * 批量更新產品庫存
   */
  async updateProductStock(updates: Array<{ id: string; quantity: number }>): Promise<Product[]> {
    return this.post<Product[]>('/products/batch-update-stock', { updates });
  }
}

/**
 * 創建產品 API 客戶端實例
 */
export const createProductApiClient = (httpClient: HttpClient): ProductApiClient => {
  return new ProductApiClient(httpClient);
};

// 重新匯出基礎類型
export type { HttpClient } from './baseApiClient';