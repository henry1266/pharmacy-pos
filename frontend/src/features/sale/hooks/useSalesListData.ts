import { useState, useEffect, useCallback } from 'react';
import { useGetSalesQuery, useGetTodaySalesQuery } from '../api/saleApi';
import type { Sale, SaleItem, User } from '../types/list';
import type { SaleQueryParams } from '../api/dto';
import type { Customer } from '@pharmacy-pos/shared/types/entities';

/**
 * 取得今日銷售清單或查詢結果（RTK Query）
 */
const useSalesListData = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<SaleQueryParams | undefined>(undefined);

  // 測試模式旗標（僅用於 UI 顯示）
  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  // RTK Query hooks：有查詢條件用 getSales，否則用 getTodaySales
  const hasSearch = Boolean(searchParams?.search || searchParams?.wildcardSearch);
  const todayQuery = useGetTodaySalesQuery(undefined, { skip: hasSearch });
  const listQuery = useGetSalesQuery(searchParams, { skip: !hasSearch });

  // 統一由 RTK Query 更新本地狀態
  useEffect(() => {
    const activeData = hasSearch ? listQuery.data : todayQuery.data;
    const activeError = hasSearch ? (listQuery.error as any) : (todayQuery.error as any);
    const activeFetching = hasSearch ? listQuery.isFetching : todayQuery.isFetching;

    setLoading(activeFetching);

    if (activeError) {
      const message = typeof activeError?.data === 'string' ? activeError.data : activeError?.data?.message || '載入銷售資料失敗';
      setError(message);
    } else {
      setError(null);
    }

    if (Array.isArray(activeData)) {
      setSales(activeData as unknown as Sale[]);
    } else if (!activeData) {
      setSales([]);
    }
  }, [hasSearch, listQuery.data, listQuery.error, listQuery.isFetching, todayQuery.data, todayQuery.error, todayQuery.isFetching]);

  // 重新整理清單
  const refreshSales = useCallback(() => {
    if (hasSearch) {
      listQuery.refetch();
    } else {
      todayQuery.refetch();
    }
  }, [hasSearch, listQuery.refetch, todayQuery.refetch]);

  // 查詢銷售記錄
  const searchSales = useCallback((searchTerm: string, wildcardMode: boolean = false) => {
    if (!searchTerm.trim()) {
      setSearchParams(undefined);
      return;
    }
    setSearchParams(wildcardMode ? { wildcardSearch: searchTerm } : { search: searchTerm });
  }, []);

  return {
    sales,
    loading,
    error,
    isTestMode,
    refreshSales,
    searchSales
  };
};

export default useSalesListData;
export type { Sale, SaleItem, User, Customer };
