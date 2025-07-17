/**
 * 新版會計服務 - 使用統一的 API 客戶端
 * 這個版本展示了如何使用 shared 模組來減少重複代碼
 */

import { AccountingApiClient, createAccountingApiClient } from '@pharmacy-pos/shared';
import apiService from '../utils/apiService';

// 創建 axios 適配器以符合 HttpClient 介面，使用配置了攔截器的 apiService
const axiosAdapter = {
  get: apiService.get.bind(apiService),
  post: apiService.post.bind(apiService),
  put: apiService.put.bind(apiService),
  delete: apiService.delete.bind(apiService)
};

// 創建統一的會計 API 客戶端實例
const accountingApiClient: AccountingApiClient = createAccountingApiClient(axiosAdapter);

/**
 * 新版會計服務 - 使用統一的 API 客戶端
 * 這個服務展示了整合到 SHARED 後的優勢：
 * 1. 減少重複的錯誤處理邏輯
 * 2. 統一的 API 調用模式
 * 3. 標準化的日期格式處理
 * 4. 更好的類型安全性
 * 5. 更容易測試和維護
 */
export const accountingServiceV2 = {
  // 記帳記錄相關
  getAccountingRecords: accountingApiClient.getAccountingRecords.bind(accountingApiClient),
  createAccountingRecord: accountingApiClient.createAccountingRecord.bind(accountingApiClient),
  updateAccountingRecord: accountingApiClient.updateAccountingRecord.bind(accountingApiClient),
  deleteAccountingRecord: accountingApiClient.deleteAccountingRecord.bind(accountingApiClient),
  getUnaccountedSales: accountingApiClient.getUnaccountedSales.bind(accountingApiClient),

  // 記帳分類相關
  getAccountingCategories: accountingApiClient.getAccountingCategories.bind(accountingApiClient),
  addAccountingCategory: accountingApiClient.addAccountingCategory.bind(accountingApiClient),
  updateAccountingCategory: accountingApiClient.updateAccountingCategory.bind(accountingApiClient),
  deleteAccountingCategory: accountingApiClient.deleteAccountingCategory.bind(accountingApiClient)
};

export default accountingServiceV2;