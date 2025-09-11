/**
 * Account Statistics Hook
 * 管理科目統計資料
 */

import { useState, useEffect, useCallback } from 'react';

interface AccountStatistics {
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: number;
  monthlyTrend: Array<{
    month: string;
    balance: number;
    transactions: number;
  }>;
}

export interface UseAccountStatisticsReturn {
  statistics: AccountStatistics | null;
  loading: boolean;
  error: string | null;
  refreshStatistics: () => Promise<void>;
}

export const useAccountStatistics = (organizationId?: string): UseAccountStatisticsReturn => {
  const [statistics, setStatistics] = useState<AccountStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: 實作統計資料獲取邏輯
      // const response = await accounting3Service.getAccountStatistics(organizationId);
      
      // 暫時使用模擬資料
      setStatistics({
        totalAccounts: 0,
        activeAccounts: 0,
        totalBalance: 0,
        monthlyTrend: []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '獲取統計資料失敗');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    refreshStatistics();
  }, [refreshStatistics]);

  return {
    statistics,
    loading,
    error,
    refreshStatistics
  };
};