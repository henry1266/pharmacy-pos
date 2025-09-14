import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import testModeDataService from '@/testMode/services/TestModeDataService';
import { getTestSales, type ExtendedSale } from '@/testMode/data/TestModeData';
import { useGetSalesQuery, useGetTodaySalesQuery } from '../api/saleApi';

// API 響應型別定義
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// 定義類型
interface SaleItem {
  product?: {
    name: string;
    _id?: string;
    id?: string;
  };
  name?: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  amount?: number;
  subtotal?: number;
}

interface User {
  _id: string;
  name: string;
}

interface Customer {
  _id: string;
  name: string;
}

// 銷售記錄類型 - 使用統一的 ExtendedSale 類型
interface Sale extends ExtendedSale {}

/**
 * 測試模式用：過濾今日且銷貨單號前綴符合今日
 */
const filterTodaySalesWithMatchingPrefix = (sales: Sale[]): Sale[] => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return sales.filter(sale => {
    if (!sale.date) return false;
    const saleDate = format(new Date(sale.date), 'yyyy-MM-dd');
    const isToday = saleDate === today;
    if (!sale.saleNumber) return isToday;
    const saleDatePrefix = sale.saleNumber.substring(0, 8);
    const todayPrefix = format(new Date(), 'yyyyMMdd');
    return isToday && saleDatePrefix === todayPrefix;
  });
};

/**
 * 提供今日銷售清單（預設）與搜尋（全部）能力，改用 RTK Query 取得資料。
 */
const useSalesListData = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<{ search?: string; wildcardSearch?: string } | undefined>(undefined);

  // 初始化測試模式
  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  // RTK Query hooks：有搜尋用 getSales，無搜尋顯示今日用 getTodaySales
  const hasSearch = Boolean(searchParams?.search || searchParams?.wildcardSearch);
  const mergedSearch = searchParams?.wildcardSearch ?? searchParams?.search;

  const todayQuery = useGetTodaySalesQuery({}, { skip: isTestMode || hasSearch });
  const listQuery = useGetSalesQuery(
    mergedSearch ? ({ search: mergedSearch } as any) : ({} as any),
    { skip: isTestMode || !hasSearch }
  );

  // 測試模式下取得銷售數據
  const fetchTestModeSales = useCallback(async (): Promise<void> => {
    try {
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = await axios.get<ApiResponse<Sale[]>>('/api/sales');
      const salesData = response.data.data ?? [];

      if (Array.isArray(salesData) && salesData.length > 0) {
        const filteredSales = filterTodaySalesWithMatchingPrefix(salesData);
        setSales(filteredSales);
      } else {
        // 使用測試模式內建資料
        const testSalesData = testModeDataService.getSales(null, null);
        const filteredMockSales = filterTodaySalesWithMatchingPrefix(testSalesData);
        setSales(filteredMockSales);
      }
    } catch (err) {
      // 取得實際資料失敗則改用模擬資料
      const testSalesData = testModeDataService.getSales(null, null);
      const filteredMockSales = filterTodaySalesWithMatchingPrefix(testSalesData);
      setSales(filteredMockSales);
    } finally {
      setLoading(false);
    }
  }, []);

  // 生產模式：由 RTK Query 推動資料更新
  useEffect(() => {
    if (isTestMode) return;

    const activeData = hasSearch ? listQuery.data : todayQuery.data;
    const activeError: any = hasSearch ? listQuery.error : todayQuery.error;
    const activeFetching = hasSearch ? listQuery.isFetching : todayQuery.isFetching;

    setLoading(activeFetching);

    if (activeError) {
      const message = typeof activeError?.data === 'string'
        ? activeError.data
        : activeError?.data?.message || '取得銷售資料失敗';
      setError(message);
    } else {
      setError(null);
    }

    if (activeData && Array.isArray(activeData.data)) {
      setSales(activeData.data as unknown as Sale[]);
    }
  }, [isTestMode, hasSearch, listQuery.data, listQuery.error, listQuery.isFetching, todayQuery.data, todayQuery.error, todayQuery.isFetching]);

  // 首次載入
  useEffect(() => {
    if (isTestMode) {
      setLoading(true);
      fetchTestModeSales();
    }
  }, [isTestMode, fetchTestModeSales]);

  // 重新整理清單
  const refreshSales = useCallback(() => {
    if (isTestMode) {
      setLoading(true);
      fetchTestModeSales();
      return;
    }
    if (hasSearch) {
      listQuery.refetch();
    } else {
      todayQuery.refetch();
    }
  }, [isTestMode, hasSearch, listQuery.refetch, todayQuery.refetch, fetchTestModeSales]);

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

