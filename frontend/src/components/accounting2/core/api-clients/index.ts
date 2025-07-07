/**
 * Accounting2 API 客戶端統一導出
 * 提供所有 API 客戶端的統一入口點
 */

// 導入預設實例
import { accountApiClient } from './AccountApiClient';
import { transactionApiClient } from './TransactionApiClient';
import { fundingApiClient } from './FundingApiClient';

// 導入工廠函數
import { createAccountApiClient } from './AccountApiClient';
import { createTransactionApiClient } from './TransactionApiClient';
import { createFundingApiClient } from './FundingApiClient';

// API 客戶端類別導出
export { AccountApiClient, createAccountApiClient, accountApiClient } from './AccountApiClient';
export { TransactionApiClient, createTransactionApiClient, transactionApiClient } from './TransactionApiClient';
export { FundingApiClient, createFundingApiClient, fundingApiClient } from './FundingApiClient';

// 預設 API 客戶端實例集合
export const apiClients = {
  account: accountApiClient,
  transaction: transactionApiClient,
  funding: fundingApiClient
} as const;

// API 客戶端工廠函數集合
export const createApiClients = () => ({
  account: createAccountApiClient(),
  transaction: createTransactionApiClient(),
  funding: createFundingApiClient()
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
  },

  /**
   * 獲取所有 API 客戶端快取統計
   */
  getStats(): {
    account: { size: number; keys: string[] };
    transaction: { size: number; keys: string[] };
    funding: { size: number; keys: string[] };
    total: number;
  } {
    const accountStats = apiClients.account.getCacheStats();
    const transactionStats = apiClients.transaction.getCacheStats();
    const fundingStats = apiClients.funding.getCacheStats();

    return {
      account: accountStats,
      transaction: transactionStats,
      funding: fundingStats,
      total: accountStats.size + transactionStats.size + fundingStats.size
    };
  }
};

// 預設導出
export default apiClients;