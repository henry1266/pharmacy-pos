/**
 * 產品 API 客戶端
 * 基於通用 BaseApiClient 實現
 */

import { BaseApiClient, HttpClient } from './baseApiClient';
import type { Product } from '../types/entities';
import { ProductType } from '../enums';

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
    // 根據產品類型決定使用哪個端點
    const endpoint = productData.productType === ProductType.MEDICINE ? '/products/medicine' : '/products/product';
    return this.createItem<Product>(endpoint, productData);
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
    // 使用現有的 getAllProducts 端點，然後在客戶端進行過濾
    const allProducts = await this.getAllProducts();
    if (!query || query.trim() === '') {
      return allProducts;
    }
    
    const searchTerm = query.toLowerCase().trim();
    return allProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.code.toLowerCase().includes(searchTerm) ||
      product.shortCode?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * 獲取低庫存產品
   */
  async getLowStockProducts(): Promise<Product[]> {
    // 使用現有的 getAllProducts 端點，然後在客戶端進行過濾
    const allProducts = await this.getAllProducts();
    return allProducts.filter(product =>
      product.stock !== undefined &&
      product.minStock !== undefined &&
      product.stock <= product.minStock &&
      product.minStock >= 0 // 最低庫存可以為 0
    );
  }

  /**
   * 根據產品代碼獲取產品
   */
  async getProductByCode(code: string): Promise<Product | null> {
    try {
      return await this.get<Product>(`/products/code/${code}`);
    } catch (error: any) {
      // 如果產品不存在，返回 null 而不是拋出錯誤
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 批量更新產品庫存
   */
  async updateProductStock(updates: Array<{ id: string; quantity: number }>): Promise<Product[]> {
    // 由於後端沒有批量更新端點，我們逐一更新每個產品
    const updatedProducts: Product[] = [];
    
    for (const update of updates) {
      try {
        const updatedProduct = await this.updateProduct(update.id, { stock: update.quantity });
        updatedProducts.push(updatedProduct);
      } catch (error) {
        console.error(`更新產品 ${update.id} 庫存失敗:`, error);
        // 繼續處理其他產品，不中斷整個批量操作
      }
    }
    
    return updatedProducts;
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