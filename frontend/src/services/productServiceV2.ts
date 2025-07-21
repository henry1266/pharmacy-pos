/**
 * 產品服務 V2 - 使用統一 API 客戶端
 * 展示 SHARED 整合的優勢
 */

import axios from 'axios';
import { createProductApiClient, HttpClient } from '@pharmacy-pos/shared';
import type { Product } from '@pharmacy-pos/shared';

/**
 * 產品篩選參數介面
 */
export interface ProductFilters {
  search?: string;
  productType?: 'all' | 'product' | 'medicine';
  category?: string;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'all' | 'low' | 'out' | 'normal';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Axios 適配器 - 實現 HttpClient 介面
 */
const axiosAdapter: HttpClient = {
  get: axios.get,
  post: axios.post,
  put: axios.put,
  delete: axios.delete,
};

/**
 * 創建產品 API 客戶端實例
 */
const productApiClient = createProductApiClient(axiosAdapter);

/**
 * 產品服務 V2 - 前端適配器
 * 使用方法綁定實現零重複代碼
 */
export const productServiceV2 = {
  // 直接綁定 API 客戶端方法
  getAllProducts: productApiClient.getAllProducts.bind(productApiClient),
  getProductById: productApiClient.getProductById.bind(productApiClient),
  getProductByCode: productApiClient.getProductByCode.bind(productApiClient),
  createProduct: productApiClient.createProduct.bind(productApiClient),
  updateProduct: productApiClient.updateProduct.bind(productApiClient),
  deleteProduct: productApiClient.deleteProduct.bind(productApiClient),
  searchProducts: productApiClient.searchProducts.bind(productApiClient),
  getLowStockProducts: productApiClient.getLowStockProducts.bind(productApiClient),
  updateProductStock: productApiClient.updateProductStock.bind(productApiClient),
  
  /**
   * 獲取篩選後的產品列表
   */
  getFilteredProducts: async (filters: ProductFilters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // 添加篩選參數
      if (filters.search?.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters.productType && filters.productType !== 'all') {
        params.append('productType', filters.productType);
      }
      if (filters.category) {
        params.append('category', filters.category);
      }
      if (filters.supplier) {
        params.append('supplier', filters.supplier);
      }
      if (filters.minPrice !== undefined) {
        params.append('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined) {
        params.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters.stockStatus && filters.stockStatus !== 'all') {
        params.append('stockStatus', filters.stockStatus);
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/api/products?${queryString}` : '/api/products';
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('獲取篩選產品失敗:', error);
      throw error;
    }
  }
};

export default productServiceV2;

// 類型匯出
export type { Product };
export type { ProductQueryParams } from '@pharmacy-pos/shared';