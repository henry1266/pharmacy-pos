/**
 * 優化的帳戶列表 Hook
 * 展示 useCallback、useMemo 和錯誤處理的最佳實踐
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import { accountApiClient } from '../api-clients';
import { useErrorHandler } from './useErrorHandler';
import { useNotification } from '../components/NotificationProvider';
import organizationService from '../../../../services/organizationService';

// Hook 參數介面
interface UseOptimizedAccountListParams {
  organizationId?: string | null;
  autoLoad?: boolean;
  cacheTimeout?: number;
}

// Hook 回傳值介面
interface UseOptimizedAccountListReturn {
  // 資料狀態
  accounts: Account2[];
  organizations: Organization[];
  filteredAccounts: Account2[];
  
  // 載入狀態
  loading: boolean;
  organizationsLoading: boolean;
  
  // 篩選狀態
  searchTerm: string;
  selectedType: string;
  
  // 統計資料
  statistics: {
    totalCount: number;
    activeCount: number;
    totalBalance: Record<string, number>;
    typeDistribution: Record<string, number>;
  };
  
  // 動作函數
  loadAccounts: () => Promise<void>;
  loadOrganizations: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setSelectedType: (type: string) => void;
  clearFilters: () => void;
  refreshData: () => Promise<void>;
}

/**
 * 優化的帳戶列表 Hook
 */
export const useOptimizedAccountList = ({
  organizationId,
  autoLoad = true,
  cacheTimeout = 5 * 60 * 1000 // 5 分鐘
}: UseOptimizedAccountListParams = {}): UseOptimizedAccountListReturn => {
  
  // 錯誤處理和通知
  const { handleError } = useErrorHandler();
  const { showSuccess, showError } = useNotification();
  
  // 基本狀態
  const [accounts, setAccounts] = useState<Account2[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  
  // 篩選狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // 快取狀態
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

  /**
   * 載入帳戶列表
   */
  const loadAccounts = useCallback(async () => {
    // 檢查快取是否有效
    const now = Date.now();
    if (now - lastLoadTime < cacheTimeout && accounts.length > 0) {
      console.log('使用快取的帳戶資料');
      return;
    }

    try {
      setLoading(true);
      console.log('載入帳戶列表，機構ID:', organizationId);
      
      const response = await accountApiClient.getAccounts({
        organizationId: organizationId || undefined
      });
      
      if (response.success && response.data) {
        setAccounts(response.data);
        setLastLoadTime(now);
        console.log('帳戶列表載入成功:', response.data.length);
      } else {
        showError('載入帳戶列表失敗');
      }
    } catch (error) {
      handleError(error, { 
        operation: 'loadAccounts', 
        organizationId,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, cacheTimeout, lastLoadTime, accounts.length, handleError, showError]);

  /**
   * 載入機構列表
   */
  const loadOrganizations = useCallback(async () => {
    try {
      setOrganizationsLoading(true);
      const response = await organizationService.getOrganizations();
      
      if (response.success && response.data) {
        setOrganizations(response.data);
      }
    } catch (error) {
      handleError(error, { operation: 'loadOrganizations' });
    } finally {
      setOrganizationsLoading(false);
    }
  }, [handleError]);

  /**
   * 篩選帳戶列表
   */
  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    // 按搜尋詞篩選
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(term) ||
        account.code?.toLowerCase().includes(term) ||
        account.description?.toLowerCase().includes(term)
      );
    }

    // 按類型篩選
    if (selectedType) {
      filtered = filtered.filter(account => account.type === selectedType);
    }

    return filtered;
  }, [accounts, searchTerm, selectedType]);

  /**
   * 計算統計資料
   */
  const statistics = useMemo(() => {
    const totalCount = accounts.length;
    const activeCount = accounts.filter(acc => acc.isActive !== false).length;
    
    // 按幣別計算總餘額
    const totalBalance = accounts.reduce((balances, account) => {
      const currency = account.currency || 'TWD';
      balances[currency] = (balances[currency] || 0) + account.balance;
      return balances;
    }, {} as Record<string, number>);
    
    // 按類型分布
    const typeDistribution = accounts.reduce((distribution, account) => {
      distribution[account.type] = (distribution[account.type] || 0) + 1;
      return distribution;
    }, {} as Record<string, number>);

    return {
      totalCount,
      activeCount,
      totalBalance,
      typeDistribution
    };
  }, [accounts]);

  /**
   * 清除篩選
   */
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedType('');
  }, []);

  /**
   * 強制重新整理資料
   */
  const refreshData = useCallback(async () => {
    setLastLoadTime(0); // 清除快取時間戳
    await Promise.all([
      loadAccounts(),
      loadOrganizations()
    ]);
    showSuccess('資料已重新整理');
  }, [loadAccounts, loadOrganizations, showSuccess]);

  // 自動載入效果
  useEffect(() => {
    if (autoLoad) {
      loadOrganizations();
    }
  }, [autoLoad, loadOrganizations]);

  useEffect(() => {
    if (autoLoad) {
      loadAccounts();
    }
  }, [autoLoad, organizationId, loadAccounts]);

  return {
    // 資料狀態
    accounts,
    organizations,
    filteredAccounts,
    
    // 載入狀態
    loading,
    organizationsLoading,
    
    // 篩選狀態
    searchTerm,
    selectedType,
    
    // 統計資料
    statistics,
    
    // 動作函數
    loadAccounts,
    loadOrganizations,
    setSearchTerm,
    setSelectedType,
    clearFilters,
    refreshData
  };
};

export default useOptimizedAccountList;