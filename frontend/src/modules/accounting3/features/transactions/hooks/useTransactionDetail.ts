import { useState, useEffect } from 'react';
import {
  TransactionGroupWithEntries3,
  EmbeddedAccountingEntry3,
  Account3
} from '@pharmacy-pos/shared/types/accounting3';
import { accounting3Service } from '../../../services/accounting3Service';
import { cleanAndValidateTransactionId } from '../utils';

interface UseTransactionDetailReturn {
  transaction: TransactionGroupWithEntries3 | null;
  accounts: Record<string, Account3>;
  loading: boolean;
  error: string | null;
  loadTransaction: () => Promise<void>;
}

/**
 * 自定義 Hook 用於處理交易詳細資料載入
 *
 * 此 Hook 負責從 API 獲取交易詳細資料，包括交易基本資訊和相關的科目資料。
 * 它處理資料載入狀態、錯誤處理，並提供重新載入的功能。
 *
 * 功能：
 * - 根據交易 ID 載入交易詳細資料
 * - 載入交易相關的科目資料
 * - 處理載入狀態和錯誤
 * - 提供重新載入交易資料的方法
 *
 * @param {string} transactionId - 要載入的交易 ID
 * @returns {UseTransactionDetailReturn} 包含交易資料、載入狀態和錯誤資訊的物件
 * @returns {TransactionGroupWithEntries3 | null} return.transaction - 交易資料
 * @returns {Record<string, Account3>} return.accounts - 交易相關的科目資料
 * @returns {boolean} return.loading - 載入狀態
 * @returns {string | null} return.error - 錯誤訊息
 * @returns {() => Promise<void>} return.loadTransaction - 重新載入交易資料的方法
 *
 * @example
 * // 在元件中使用
 * const { transaction, accounts, loading, error } = useTransactionDetail(transactionId);
 *
 * if (loading) {
 *   return <LoadingIndicator />;
 * }
 *
 * if (error) {
 *   return <ErrorMessage message={error} />;
 * }
 *
 * return <TransactionView transaction={transaction} accounts={accounts} />;
 */
export const useTransactionDetail = (transactionId: string): UseTransactionDetailReturn => {
  const [transaction, setTransaction] = useState<TransactionGroupWithEntries3 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Record<string, Account3>>({});

  // 載入科目資料
  const loadAccountsData = async (entries: EmbeddedAccountingEntry3[]) => {
    try {
      const accountIds = entries
        .map(entry => typeof entry.accountId === 'string' ? entry.accountId : entry.accountId._id)
        .filter((id, index, arr) => arr.indexOf(id) === index); // 去重

      const accountsData: Record<string, Account3> = {};
      
      // 批量載入科目資料
      await Promise.all(
        accountIds.map(async (accountId) => {
          try {
            const accountResponse = await accounting3Service.accounts.getById(accountId);
            if (accountResponse.success && accountResponse.data) {
              accountsData[accountId] = accountResponse.data;
            }
          } catch (error) {
            console.warn(`載入科目 ${accountId} 失敗:`, error);
          }
        })
      );

      setAccounts(accountsData);
    } catch (error) {
      console.error('載入科目資料失敗:', error);
    }
  };

  // 載入交易資料
  const loadTransaction = async () => {
    try {
      setLoading(true);
      setError(null);

      // 驗證和清理 transactionId
      const { cleanId, isValid, error: validationError } = cleanAndValidateTransactionId(transactionId);
      
      if (!isValid) {
        setError(validationError || '無效的交易ID');
        return;
      }
      
      console.log('🚀 使用 ID 調用 API:', cleanId);

      // 獲取交易詳細資料
      const response = await accounting3Service.transactions.getById(cleanId);
      
      if (response.success && response.data) {
        setTransaction(response.data);
        
        // 載入相關科目資料
        await loadAccountsData(response.data.entries);
      } else {
        setError('無法載入交易資料');
      }
    } catch (err) {
      console.error('載入交易失敗:', err);
      setError('載入交易時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 載入交易資料
  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  return {
    transaction,
    accounts,
    loading,
    error,
    loadTransaction
  };
};