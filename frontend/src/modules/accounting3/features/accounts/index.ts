/**
 * Accounts Feature Export
 * 統一導出 accounts 功能的所有內容
 */

// 組件導出 - 從 components/index.ts 重新導出
export {
  AccountDashboard,
  AccountForm,
  AccountSelector,
  AccountTransactionList,
  AccountTreeView,
  AccountTypeManagement,
  AccountHierarchyManager
} from './components';

// Hooks 導出
export {
  useAccountForm,
  useAccountStatistics
} from './hooks';

// 服務導出
export {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountStatistics,
  getAccountTransactions
} from '../../accounts/services';

// 型別導出 - 從新位置導入
export type {
  Account,
  AccountType,
  AccountFormData,
  AccountTreeNode,
  AccountFilterOptions,
  AccountStatistics,
  AccountsResponse,
  CreateAccountRequest,
  UpdateAccountRequest
} from '../../accounts/types';

// Hook 型別導出
export type {
  UseAccountFormReturn,
  UseAccountStatisticsReturn
} from './hooks';

// 工具函數導出 - 從新位置導入
export {
  buildAccountTree,
  generateAccountCode,
  getAccountTypePrefix,
  getAccountTypeName,
  validateAccountCode,
  filterAccounts,
  calculateAccountLevel,
  getAccountPath,
  formatAccountBalance,
  canDeleteAccount
} from '../../accounts/utils';