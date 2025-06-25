/**
 * 供應商服務 V2 版本
 * 使用 shared 模組的統一 API 客戶端
 */

import axios from 'axios';
import { createSupplierApiClient, type HttpClient } from '@pharmacy-pos/shared';

// 創建 axios 適配器以符合 HttpClient 介面
const axiosAdapter: HttpClient = {
  get: axios.get.bind(axios),
  post: axios.post.bind(axios),
  put: axios.put.bind(axios),
  delete: axios.delete.bind(axios),
};

// 創建供應商 API 客戶端實例
const supplierApiClient = createSupplierApiClient(axiosAdapter);

// 直接匯出所有方法，實現零重複代碼
export const getAllSuppliers = supplierApiClient.getAllSuppliers.bind(supplierApiClient);
export const getSupplierById = supplierApiClient.getSupplierById.bind(supplierApiClient);
export const createSupplier = supplierApiClient.createSupplier.bind(supplierApiClient);
export const updateSupplier = supplierApiClient.updateSupplier.bind(supplierApiClient);
export const deleteSupplier = supplierApiClient.deleteSupplier.bind(supplierApiClient);
export const searchSuppliers = supplierApiClient.searchSuppliers.bind(supplierApiClient);
export const getActiveSuppliers = supplierApiClient.getActiveSuppliers.bind(supplierApiClient);

// 匯出類型
export type { SupplierQueryParams } from '@pharmacy-pos/shared';