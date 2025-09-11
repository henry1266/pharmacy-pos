import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import testModeDataService from '../../../testMode/services/TestModeDataService';
import { getTestSales, type ExtendedSale } from '../../../testMode/data/TestModeData';

// API 回應型別定義
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
 * 過濾銷售記錄：只顯示當天且前八碼相符的記錄
 * @param sales 銷售記錄陣列
 * @returns 過濾後的銷售記錄
 */
const filterTodaySalesWithMatchingPrefix = (sales: Sale[]): Sale[] => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return sales.filter(sale => {
    // 檢查日期是否為當天
    if (!sale.date) return false;
    
    const saleDate = format(new Date(sale.date), 'yyyy-MM-dd');
    const isToday = saleDate === today;
    
    // 檢查銷售編號前八碼是否與當天日期相符
    if (!sale.saleNumber) return isToday;
    
    // 提取前八碼 (格式通常為 YYYYMMDD)
    const saleDatePrefix = sale.saleNumber.substring(0, 8);
    const todayPrefix = format(new Date(), 'yyyyMMdd');
    const isPrefixMatch = saleDatePrefix === todayPrefix;
    
    return isToday && isPrefixMatch;
  });
};

/**
 * Custom Hook to manage sales list data with refresh capability
 */
const useSalesListData = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // 防重複請求的最小間隔（毫秒）
  const FETCH_DEBOUNCE_TIME = 1000;

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  // 檢查是否可以發起新的請求
  const canFetch = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    return timeSinceLastFetch >= FETCH_DEBOUNCE_TIME;
  }, [lastFetchTime]);

  // 獲取銷售數據（帶防重複機制）
  const fetchSales = useCallback(async (searchParams?: { search?: string; wildcardSearch?: string }): Promise<void> => {
    // 防重複請求檢查
    if (!canFetch()) {
      console.log('🚫 銷售數據請求過於頻繁，已跳過');
      return;
    }

    setLoading(true);
    setError(null);
    setLastFetchTime(Date.now());
    
    if (isTestMode) {
      await fetchTestModeSales();
    } else {
      await fetchProductionSales(searchParams);
    }
  }, [isTestMode, canFetch]);

  // 測試模式下獲取銷售數據
  const fetchTestModeSales = async (): Promise<void> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = await axios.get<ApiResponse<Sale[]>>('/api/sales');
      const salesData = response.data.data ?? [];
      
      if (Array.isArray(salesData) && salesData.length > 0) {
        // 過濾當天且前八碼相符的記錄
        const filteredSales = filterTodaySalesWithMatchingPrefix(salesData);
        setSales(filteredSales);
      } else {
        console.log("Test Mode: No actual sales data, using mock data.");
        // 使用統一的測試模式數據服務
        const testSalesData = testModeDataService.getSales(null, null);
        const filteredMockSales = filterTodaySalesWithMatchingPrefix(testSalesData);
        setSales(filteredMockSales);
      }
    } catch (err) {
      console.warn('Test Mode: Failed to fetch actual sales, using mock data.', err);
      // 使用統一的測試模式數據服務
      const testSalesData = testModeDataService.getSales(null, null);
      const filteredMockSales = filterTodaySalesWithMatchingPrefix(testSalesData);
      setSales(filteredMockSales);
    } finally {
      setLoading(false);
    }
  };

  // 生產模式下獲取銷售數據
  const fetchProductionSales = async (searchParams?: { search?: string; wildcardSearch?: string }): Promise<void> => {
    try {
      const params: Record<string, string> = {};
      
      // 添加搜尋參數
      if (searchParams?.wildcardSearch) {
        params.wildcardSearch = searchParams.wildcardSearch;
      } else if (searchParams?.search) {
        params.search = searchParams.search;
      }
      
      const response = await axios.get<ApiResponse<Sale[]>>('/api/sales', { params });
      const salesData = response.data.data ?? [];
      if (Array.isArray(salesData)) {
        // 如果有搜尋參數，不進行日期過濾，讓後端處理
        const filteredSales = (searchParams?.search || searchParams?.wildcardSearch)
          ? salesData
          : filterTodaySalesWithMatchingPrefix(salesData);
        setSales(filteredSales);
      } else {
        console.warn('API 回傳的資料格式不正確:', response.data);
        setSales([]);
      }
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      setError('獲取銷售數據失敗');
    } finally {
      setLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // 刷新銷售清單
  const refreshSales = useCallback(() => {
    fetchSales();
  }, [fetchSales]);

  // 搜尋銷售記錄
  const searchSales = useCallback((searchTerm: string, wildcardMode: boolean = false) => {
    if (!searchTerm.trim()) {
      // 如果搜尋條件為空，重新載入所有記錄
      fetchSales();
      return;
    }

    const searchParams = wildcardMode
      ? { wildcardSearch: searchTerm }
      : { search: searchTerm };
    
    fetchSales(searchParams);
  }, [fetchSales]);

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