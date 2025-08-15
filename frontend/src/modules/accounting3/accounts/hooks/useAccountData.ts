/**
 * Account Data Management Hook
 * 管理科目資料的獲取、更新和快取
 */

import { useState, useEffect, useCallback } from 'react';
import { Account3 } from '@pharmacy-pos/shared/types/accounting3';
import { accounting3Service } from '../../services/accounting3Service';

export interface UseAccountDataOptions {
  organizationId?: string | null;
  autoLoad?: boolean;
}

export interface UseAccountDataReturn {
  accounts: Account3[];
  loading: boolean;
  error: string | null;
  loadAccounts: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  getAccountById: (id: string) => Account3 | undefined;
}

export const useAccountData = (options: UseAccountDataOptions = {}): UseAccountDataReturn => {
  const { organizationId, autoLoad = true } = options;
  
  const [accounts, setAccounts] = useState<Account3[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await accounting3Service.accounts.getAll(organizationId);
      
      if (response.success && response.data) {
        setAccounts(response.data);
      } else {
        setError('獲取科目資料失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const refreshAccounts = useCallback(async () => {
    await loadAccounts();
  }, [loadAccounts]);

  const getAccountById = useCallback((id: string): Account3 | undefined => {
    const findAccount = (accounts: Account3[]): Account3 | undefined => {
      for (const account of accounts) {
        if (account._id === id) {
          return account;
        }
        if (account.children && account.children.length > 0) {
          const found = findAccount(account.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    return findAccount(accounts);
  }, [accounts]);

  useEffect(() => {
    if (autoLoad) {
      loadAccounts();
    }
  }, [autoLoad, loadAccounts]);

  return {
    accounts,
    loading,
    error,
    loadAccounts,
    refreshAccounts,
    getAccountById
  };
};