/**
 * Accounts Hooks Export
 * 統一導出所有 accounts 相關的 hooks
 *
 * 注意：這個文件只是為了向後兼容，所有 hooks 已經移動到 ../../../accounts/hooks 目錄
 */

// 從新位置重新導出 hooks
export { useAccountForm } from '../../../accounts/hooks/useAccountForm';
export { useAccountStatistics } from '../../../accounts/hooks/useAccountStatistics';

// 從新位置重新導出 hook 相關的型別
export type { UseAccountFormReturn } from '../../../accounts/hooks/useAccountForm';
export type { UseAccountStatisticsReturn } from '../../../accounts/hooks/useAccountStatistics';

// TODO: 完成後再啟用
// export { useAccountData } from './useAccountData';
// export type { UseAccountDataReturn } from './useAccountData';