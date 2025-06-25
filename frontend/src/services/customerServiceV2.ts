/**
 * 客戶服務 V2 版本
 * 使用 shared 模組的統一 API 客戶端
 */

import axios from 'axios';
import { createCustomerApiClient, type HttpClient } from '@pharmacy-pos/shared';

// 創建 axios 適配器以符合 HttpClient 介面
const axiosAdapter: HttpClient = {
  get: axios.get.bind(axios),
  post: axios.post.bind(axios),
  put: axios.put.bind(axios),
  delete: axios.delete.bind(axios),
};

// 創建客戶 API 客戶端實例
const customerApiClient = createCustomerApiClient(axiosAdapter);

// 直接匯出所有方法，實現零重複代碼
export const getAllCustomers = customerApiClient.getAllCustomers.bind(customerApiClient);
export const getCustomerById = customerApiClient.getCustomerById.bind(customerApiClient);
export const createCustomer = customerApiClient.createCustomer.bind(customerApiClient);
export const updateCustomer = customerApiClient.updateCustomer.bind(customerApiClient);
export const deleteCustomer = customerApiClient.deleteCustomer.bind(customerApiClient);
export const searchCustomers = customerApiClient.searchCustomers.bind(customerApiClient);
export const getActiveCustomers = customerApiClient.getActiveCustomers.bind(customerApiClient);
export const getCustomerPurchaseHistory = customerApiClient.getCustomerPurchaseHistory.bind(customerApiClient);

// 匯出類型
export type { CustomerQueryParams } from '@pharmacy-pos/shared';