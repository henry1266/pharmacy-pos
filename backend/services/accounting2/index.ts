/**
 * Accounting2 服務層統一匯出
 * 提供帳戶管理、交易處理、資金追蹤和驗證服務
 */

export { AccountService } from './AccountService';
export { TransactionService } from './TransactionService';
export { FundingService } from './FundingService';
export { ValidationService } from './ValidationService';

// 預設匯出所有服務
export default {
  AccountService: require('./AccountService').AccountService,
  TransactionService: require('./TransactionService').TransactionService,
  FundingService: require('./FundingService').FundingService,
  ValidationService: require('./ValidationService').ValidationService,
};

/**
 * 服務層使用說明：
 * 
 * 1. AccountService - 帳戶管理服務
 *    - createAccount: 建立新帳戶
 *    - updateAccount: 更新帳戶資訊
 *    - deleteAccount: 刪除帳戶
 *    - getAccountById: 取得單一帳戶
 *    - getAccountsByUser: 取得使用者帳戶列表
 *    - calculateAccountStatistics: 計算帳戶統計
 * 
 * 2. TransactionService - 交易管理服務
 *    - createTransactionGroup: 建立交易群組
 *    - updateTransactionGroup: 更新交易群組
 *    - deleteTransactionGroup: 刪除交易群組
 *    - confirmTransaction: 確認交易
 *    - cancelTransaction: 取消交易
 *    - getTransactionsByUser: 取得使用者交易列表
 * 
 * 3. FundingService - 資金追蹤服務
 *    - trackFundingUsage: 追蹤資金使用
 *    - getFundingSourcesByUser: 取得資金來源列表
 *    - analyzeFundingFlow: 分析資金流向
 *    - validateFundingAllocation: 驗證資金分配
 * 
 * 4. ValidationService - 驗證服務
 *    - validateSystemIntegrity: 驗證系統完整性
 *    - generateValidationReport: 生成驗證報告
 * 
 * 使用範例：
 * ```typescript
 * import { AccountService, TransactionService } from './services/accounting2';
 * 
 * // 建立帳戶
 * const account = await AccountService.createAccount(accountData, userId);
 * 
 * // 建立交易
 * const transaction = await TransactionService.createTransactionGroup(transactionData, userId);
 * ```
 */