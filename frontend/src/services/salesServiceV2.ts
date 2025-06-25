/**
 * 銷售服務 V2 版本
 * 使用 shared 模組的統一 API 客戶端
 */

import axios from 'axios';
import { createSalesApiClient, type HttpClient } from '@pharmacy-pos/shared';

// 創建 axios 適配器以符合 HttpClient 介面
const axiosAdapter: HttpClient = {
  get: axios.get.bind(axios),
  post: axios.post.bind(axios),
  put: axios.put.bind(axios),
  delete: axios.delete.bind(axios),
};

// 創建銷售 API 客戶端實例
const salesApiClient = createSalesApiClient(axiosAdapter);

// 直接匯出所有方法，實現零重複代碼
export const getAllSales = salesApiClient.getAllSales.bind(salesApiClient);
export const getSaleById = salesApiClient.getSaleById.bind(salesApiClient);
export const createSale = salesApiClient.createSale.bind(salesApiClient);
export const updateSale = salesApiClient.updateSale.bind(salesApiClient);
export const deleteSale = salesApiClient.deleteSale.bind(salesApiClient);
export const getSalesStats = salesApiClient.getSalesStats.bind(salesApiClient);
export const getCustomerSales = salesApiClient.getCustomerSales.bind(salesApiClient);
export const getTodaySales = salesApiClient.getTodaySales.bind(salesApiClient);
export const getMonthlySales = salesApiClient.getMonthlySales.bind(salesApiClient);
export const processRefund = salesApiClient.processRefund.bind(salesApiClient);

// 匯出類型
export type { SalesQueryParams, SalesStats } from '@pharmacy-pos/shared';