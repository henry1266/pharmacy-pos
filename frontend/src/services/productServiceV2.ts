/**
 * 產品服務 V2 - 使用統一 API 客戶端
 * 展示 SHARED 整合的優勢
 */

import axios from 'axios';
import { createProductApiClient, HttpClient } from '@pharmacy-pos/shared';
import type { Product } from '@pharmacy-pos/shared';

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
  createProduct: productApiClient.createProduct.bind(productApiClient),
  updateProduct: productApiClient.updateProduct.bind(productApiClient),
  deleteProduct: productApiClient.deleteProduct.bind(productApiClient),
  searchProducts: productApiClient.searchProducts.bind(productApiClient),
  getLowStockProducts: productApiClient.getLowStockProducts.bind(productApiClient),
  updateProductStock: productApiClient.updateProductStock.bind(productApiClient),
};

export default productServiceV2;

// 類型匯出
export type { Product };
export type { ProductQueryParams } from '@pharmacy-pos/shared';