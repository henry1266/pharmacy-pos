/**
 * Accounting2 API 客戶端統一導出
 * 提供所有 API 客戶端的統一入口點
 */

// 導入預設實例
import { accountApiClient } from './AccountApiClient';
import { transactionApiClient } from './TransactionApiClient';
import { fundingApiClient } from './FundingApiClient';
import { categoryApiClient } from './CategoryApiClient';

// 導入工廠函數
import { createAccountApiClient } from './AccountApiClient';
import { createTransactionApiClient } from './TransactionApiClient';
import { createFundingApiClient } from './FundingApiClient';
import { createCategoryApiClient } from './CategoryApiClient';

// API 客戶端類別導出
export { AccountApiClient, createAccountApiClient, accountApiClient } from './AccountApiClient';
export { TransactionApiClient, createTransactionApiClient, transactionApiClient } from './TransactionApiClient';
export { FundingApiClient, createFundingApiClient, fundingApiClient } from './FundingApiClient';
export { CategoryApiClient, createCategoryApiClient, categoryApiClient } from './CategoryApiClient';

// 預設 API 客戶端實例集合
export const apiClients = {
  account: accountApiClient,
  transaction: transactionApiClient,
  funding: fundingApiClient,
  category: categoryApiClient
} as const;

// API 客戶端工廠函數集合
export const createApiClients = () => ({
  account: createAccountApiClient(),
  transaction: createTransactionApiClient(),
  funding: createFundingApiClient(),
  category: createCategoryApiClient()
});

// 統一快取管理
export const cacheManager = {
  /**
   * 清除所有 API 客戶端快取
   */
  clearAll(): void {
    apiClients.account.clearAllCache();
    apiClients.transaction.clearAllCache();
    apiClients.funding.clearAllCache();
    apiClients.category.clearAllCache();
  },

  /**
   * 獲取所有 API 客戶端快取統計
   */
  getStats(): {
    account: { size: number; keys: string[] };
    transaction: { size: number; keys: string[] };
    funding: { size: number; keys: string[] };
    category: { size: number; keys: string[] };
    total: number;
  } {
    const accountStats = apiClients.account.getCacheStats();
    const transactionStats = apiClients.transaction.getCacheStats();
    const fundingStats = apiClients.funding.getCacheStats();
    const categoryStats = apiClients.category.getCacheStats();

    return {
      account: accountStats,
      transaction: transactionStats,
      funding: fundingStats,
      category: categoryStats,
      total: accountStats.size + transactionStats.size + fundingStats.size + categoryStats.size
    };
  }
};

// 預設導出
export default apiClients;